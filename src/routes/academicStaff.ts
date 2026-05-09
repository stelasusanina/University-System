import { Router } from "express";
import { authenticate } from "../middleware/auth.ts";
import type { AuthenticatedRequest } from "../middleware/auth.ts";
import { getAcademicStaffProgram } from "../services/academicStaffService.ts";

export const academicStaffRouter = Router();

academicStaffRouter.get("/program", authenticate, async (req, res) => {
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
