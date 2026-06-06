import { prisma } from "../prisma.ts";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { StringValue } from "ms";
import { getRequiredEnv } from "../env.ts";

const JWT_SECRET = getRequiredEnv("JWT_SECRET");

function signToken(user: { id: number; email: string; role: string }, expiresIn: StringValue = "2h") {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn },
  );
}

export async function loginUser(email: string, password: string, mobile = false): Promise<{ error: string; status: number } | { token: string; user: { id: number; email: string; role: string; firstName: string; lastName: string } }> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true, password: true, student: { select: { firstName: true, lastName: true } }, academicStaff: { select: { firstName: true, lastName: true } } },
  });

  if (!user) {
    return { error: "Invalid email or password", status: 401 };
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return { error: "Invalid email or password", status: 401 };
  }

  const person = (user.student ?? user.academicStaff)!;
  const token = signToken(user, mobile ? "30d" : "2h");
  return { token, user: { id: user.id, email: user.email, role: user.role, firstName: person.firstName, lastName: person.lastName } };
}

export async function registerUser(
  email: string,
  identifierNumber: string,
  firstName: string,
  lastName: string,
  password: string,
): Promise<{ error: string; status: number } | { token: string; user: { id: number; email: string; role: string; firstName: string; lastName: string }; status: number }> {
  const student = await prisma.student.findUnique({
    where: { facultyNumber: identifierNumber },
    select: { id: true, firstName: true, lastName: true },
  });
  const academicStaff = await prisma.academicStaff.findUnique({
    where: { staffNumber: identifierNumber },
    select: { id: true, firstName: true, lastName: true, title: true },
  });

  if (!student && !academicStaff) {
    return { error: "No person found with this identifier number", status: 404 };
  }

  const person = student ?? academicStaff!;
  if (
    person.firstName.toLowerCase() !== firstName.toLowerCase() ||
    person.lastName.toLowerCase() !== lastName.toLowerCase()
  ) {
    return { error: "Names do not match the records for this identifier", status: 403 };
  }

  const role = student ? "STUDENT" : academicStaff!.title;

  const existingByLinkedRecord = await prisma.user.findFirst({
    where: student ? { studentId: student.id } : { academicStaffId: academicStaff!.id },
    select: { id: true },
  });

  if (existingByLinkedRecord) {
    return { error: "An account already exists for this person", status: 409 };
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return { error: "An account already exists for this person", status: 409 };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role,
      ...(student ? { studentId: student.id } : { academicStaffId: academicStaff!.id }),
    },
    select: { id: true, email: true, role: true },
  });

  const token = signToken(user);
  return { token, user: { id: user.id, email: user.email, role: user.role, firstName, lastName }, status: 201 };
}
