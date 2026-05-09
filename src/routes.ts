import { Router } from "express";
import { authenticate } from "./middleware/auth.ts";
import type { AuthenticatedRequest } from "./middleware/auth.ts";
import { loginUser, registerUser } from "./services/authService.ts";
import { getStudentProgram } from "./services/studentService.ts";
import { getAcademicStaffProgram } from "./services/academicStaffService.ts";
import { getEventsForUser } from "./services/eventService.ts";

export const router = Router();

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const result = await loginUser(email, password);

  if ("error" in result) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.json({ token: result.token, user: result.user });
});

router.post("/auth/register", async (req, res) => {
  const { email, identifierNumber, firstName, lastName, password } = req.body;

  if (!email || !identifierNumber || !firstName || !lastName || !password) {
    return res.status(400).json({ error: "Email, identifier number, first name, last name, and password are required" });
  }

  const result = await registerUser(email, identifierNumber, firstName, lastName, password);

  if ("error" in result) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.status(result.status).json({ token: result.token, user: result.user });
});

router.get("/student/program", authenticate, async (req, res) => {
  const { userId } = (req as AuthenticatedRequest).user;

  if (!userId) {
    return res.status(401).json({ error: "Invalid token payload" });
  }

  const result = await getStudentProgram(userId);

  if ("error" in result) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.json(result.data);
});

router.get("/academic-staff/program", authenticate, async (req, res) => {
  const { userId } = (req as AuthenticatedRequest).user;

  if (!userId) {
    return res.status(401).json({ error: "Invalid token payload" });
  }

  const result = await getAcademicStaffProgram(userId);

  if ("error" in result) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.json(result.data);
});

router.get("/events/dates", authenticate, async (req, res) => {
  const { userId } = (req as AuthenticatedRequest).user;

  if (!userId) {
    return res.status(401).json({ error: "Invalid token payload" });
  }

  const result = await getEventsForUser(userId);

  if ("error" in result) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.json(result.data);
});
