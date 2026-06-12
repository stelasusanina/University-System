import { Router } from "express";
import { authenticate } from "../middleware/auth.ts";
import type { AuthenticatedRequest } from "../middleware/auth.ts";
import { getCoursesWithStudents, getStudentsForCourseGroup, setGrade, getMyGrades } from "../services/gradeService.ts";
import { prisma } from "../prisma.ts";

const STAFF_ROLES = ["ПРОФЕСОР", "ДОЦЕНТ", "ГЛАВЕН_АСИСТЕНТ", "АСИСТЕНТ"];

export const gradesRouter = Router();

gradesRouter.get("/courses", authenticate, async (req, res) => {
  const { userId, role } = (req as AuthenticatedRequest).user;
  if (!STAFF_ROLES.includes(role)) {
    return res.status(403).json({ error: "Only academic staff can access grades" });
  }
  const userRecord = await prisma.user.findUnique({ where: { id: userId! }, select: { academicStaffId: true } });
  if (!userRecord?.academicStaffId) {
    return res.status(403).json({ error: "Academic staff record not found" });
  }
  const result = await getCoursesWithStudents(userRecord.academicStaffId);
  if ("error" in result) {
    return res.status(result.status).json({ error: result.error });
  }
  return res.json(result.data);
});

gradesRouter.get("/course-group/:courseGroupId", authenticate, async (req, res) => {
  const { userId, role } = (req as AuthenticatedRequest).user;
  if (!STAFF_ROLES.includes(role)) {
    return res.status(403).json({ error: "Only academic staff can access grades" });
  }
  const courseGroupId = parseInt(req.params.courseGroupId as string);
  if (isNaN(courseGroupId)) {
    return res.status(400).json({ error: "Invalid courseGroupId" });
  }
  const userRecord = await prisma.user.findUnique({ where: { id: userId! }, select: { academicStaffId: true } });
  if (!userRecord?.academicStaffId) {
    return res.status(403).json({ error: "Academic staff record not found" });
  }
  const result = await getStudentsForCourseGroup(courseGroupId, userRecord.academicStaffId);
  if ("error" in result) {
    return res.status(result.status).json({ error: result.error });
  }
  return res.json(result.data);
});

gradesRouter.put("/", authenticate, async (req, res) => {
  const { userId, role } = (req as AuthenticatedRequest).user;
  if (!STAFF_ROLES.includes(role)) {
    return res.status(403).json({ error: "Only academic staff can set grades" });
  }
  const { studentId, courseGroupId, grade } = req.body as { studentId?: number; courseGroupId?: number; grade?: number | null };
  if (!studentId || !courseGroupId) {
    return res.status(400).json({ error: "studentId and courseGroupId are required" });
  }
  const userRecord = await prisma.user.findUnique({ where: { id: userId! }, select: { academicStaffId: true } });
  if (!userRecord?.academicStaffId) {
    return res.status(403).json({ error: "Academic staff record not found" });
  }
  const result = await setGrade(studentId, courseGroupId, userRecord.academicStaffId, grade ?? null);
  if ("error" in result) {
    return res.status(result.status).json({ error: result.error });
  }
  return res.json(result.data);
});

gradesRouter.get("/my", authenticate, async (req, res) => {
  const { userId, role } = (req as AuthenticatedRequest).user;
  if (role !== "СТУДЕНТ") {
    return res.status(403).json({ error: "Only students can access this endpoint" });
  }
  const userRecord = await prisma.user.findUnique({ where: { id: userId! }, select: { studentId: true } });
  if (!userRecord?.studentId) {
    return res.status(403).json({ error: "Student record not found" });
  }
  const result = await getMyGrades(userRecord.studentId);
  if ("error" in result) {
    return res.status(result.status).json({ error: result.error });
  }
  return res.json(result.data);
});
