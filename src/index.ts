import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "../generated/prisma/client.ts";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { authenticate } from "./middleware/auth.ts";
import type { AuthenticatedRequest } from "./middleware/auth.ts";

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST || "localhost",
  port: Number(process.env.DATABASE_PORT) || 3306,
  user: "root",
  password: getRequiredEnv("DATABASE_PASSWORD"),
  database: "university_system",
});
const prisma = new PrismaClient({ adapter });

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

const JWT_SECRET = getRequiredEnv("JWT_SECRET");
const JWT_EXPIRES_IN = "2h";

// Login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

app.post("/api/auth/register", async (req, res) => {
  const { email, identifierNumber, firstName, lastName, password } = req.body;

  if (!email || !identifierNumber || !firstName || !lastName || !password) {
    return res.status(400).json({ error: "Email, identifier number, first name, last name, and password are required" });
  }

  // Look up in Student table by facultyNumber
  const student = await prisma.student.findUnique({
    where: { facultyNumber: identifierNumber },
  });

  // Look up in AcademicStaff table by staffNumber
  const academicStaff = await prisma.academicStaff.findUnique({
    where: { staffNumber: identifierNumber },
  });

  if (!student && !academicStaff) {
    return res.status(404).json({ error: "No person found with this identifier number" });
  }

  // Verify names match
  const person = student || academicStaff;
  if (
    person!.firstName.toLowerCase() !== firstName.toLowerCase() ||
    person!.lastName.toLowerCase() !== lastName.toLowerCase()
  ) {
    return res.status(403).json({ error: "Names do not match the records for this identifier" });
  }

  // Determine role from the matched university record.
  const role = student ? "STUDENT" : academicStaff!.title;

  // Check if user account already exists by email or linked university record.
  const existingByLinkedRecord = await prisma.user.findFirst({
    where: student
      ? { studentId: student.id }
      : { academicStaffId: academicStaff!.id },
  });

  if (existingByLinkedRecord) {
    return res.status(409).json({ error: "An account already exists for this person" });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "An account already exists for this person" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role,
      ...(student ? { studentId: student.id } : { academicStaffId: academicStaff!.id }),
    },
  });

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

app.get("/api/me/program", authenticate, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;

  if (!authenticatedReq.user.userId) {
    return res.status(401).json({ error: "Invalid token payload" });
  }

  const user = await prisma.user.findUnique({
    where: { id: authenticatedReq.user.userId },
    include: {
      student: {
        include: {
          specialty: {
            include: {
              faculty: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (!user.student) {
    return res.status(403).json({ error: "Program view is available only for student accounts" });
  }

  const currentSemester = await prisma.semester.findFirst({
    where: { isCurrent: true },
    orderBy: [{ year: "desc" }, { startDate: "desc" }],
  });

  if (!currentSemester) {
    return res.status(404).json({ error: "No active semester found" });
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      studentId: user.student.id,
      semesterId: currentSemester.id,
    },
    include: {
      course: {
        include: {
          academicStaff: true,
          schedules: {
            where: { semesterId: currentSemester.id },
            orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
          },
        },
      },
    },
    orderBy: [{ courseId: "asc" }],
  });

  return res.json({
    student: {
      id: user.student.id,
      facultyNumber: user.student.facultyNumber,
      firstName: user.student.firstName,
      lastName: user.student.lastName,
      year: user.student.year,
      group: user.student.group,
      specialty: user.student.specialty.name,
      faculty: user.student.specialty.faculty.name,
    },
    semester: {
      id: currentSemester.id,
      name: currentSemester.name,
      year: currentSemester.year,
      period: currentSemester.period,
    },
    courses: enrollments.map((enrollment) => ({
      id: enrollment.course.id,
      code: enrollment.course.code,
      name: enrollment.course.name,
      description: enrollment.course.description,
      credits: enrollment.course.credits,
      type: enrollment.course.type,
      status: enrollment.status,
      lecturer: {
        firstName: enrollment.course.academicStaff.firstName,
        lastName: enrollment.course.academicStaff.lastName,
        title: enrollment.course.academicStaff.title,
      },
      schedules: enrollment.course.schedules.map((schedule) => ({
        id: schedule.id,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        room: schedule.room,
        type: schedule.type,
      })),
    })),
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
