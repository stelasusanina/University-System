import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma.ts";
import { getRequiredEnv } from "../env.ts";

export const authRouter = Router();

const JWT_SECRET = getRequiredEnv("JWT_SECRET");
const JWT_EXPIRES_IN = "2h";

authRouter.post("/login", async (req, res) => {
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
    { expiresIn: JWT_EXPIRES_IN },
  );

  return res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

authRouter.post("/register", async (req, res) => {
  const { email, identifierNumber, firstName, lastName, password } = req.body;

  if (!email || !identifierNumber || !firstName || !lastName || !password) {
    return res.status(400).json({ error: "Email, identifier number, first name, last name, and password are required" });
  }

  const student = await prisma.student.findUnique({ where: { facultyNumber: identifierNumber } });
  const academicStaff = await prisma.academicStaff.findUnique({ where: { staffNumber: identifierNumber } });

  if (!student && !academicStaff) {
    return res.status(404).json({ error: "No person found with this identifier number" });
  }

  const person = student ?? academicStaff!;
  if (
    person.firstName.toLowerCase() !== firstName.toLowerCase() ||
    person.lastName.toLowerCase() !== lastName.toLowerCase()
  ) {
    return res.status(403).json({ error: "Names do not match the records for this identifier" });
  }

  const role = student ? "STUDENT" : academicStaff!.title;

  const existingByLinkedRecord = await prisma.user.findFirst({
    where: student ? { studentId: student.id } : { academicStaffId: academicStaff!.id },
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
    { expiresIn: JWT_EXPIRES_IN },
  );

  return res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role } });
});
