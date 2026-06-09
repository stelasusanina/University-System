import { Router } from "express";
import { authenticate } from "../middleware/auth.ts";
import type { AuthenticatedRequest } from "../middleware/auth.ts";
import { getStudentProgram } from "../services/studentService.ts";

export const studentRouter = Router();

studentRouter.get("/program", authenticate, async (req, res) => {
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
