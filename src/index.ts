import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "../generated/prisma/client.ts";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
