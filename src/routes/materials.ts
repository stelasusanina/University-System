import { Router } from "express";
import type { Request } from "express";
import { authenticate } from "../middleware/auth.ts";
import type { AuthenticatedRequest } from "../middleware/auth.ts";
import { uploadMaterial, getMaterialsForCourse, getMaterialsByStaff, deleteMaterial, getCoursesWithMaterialsForStudent, getCoursesForStaff } from "../services/materialService.ts";
import { upload } from "../utils/upload.ts";
import { prisma } from "../prisma.ts";

const STAFF_ROLES = ["ПРОФЕСОР", "ДОЦЕНТ", "ГЛАВЕН_АСИСТЕНТ", "АСИСТЕНТ"];

export const materialsRouter = Router();

materialsRouter.post(
  "/",
  authenticate,
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err instanceof Error ? err.message : "File upload failed" });
      }
      next();
    });
  },
  async (req, res) => {
    const { userId, role } = (req as AuthenticatedRequest).user;
    if (!STAFF_ROLES.includes(role)) {
      return res.status(403).json({ error: "Only academic staff can upload materials" });
    }
    const multerReq = req as Request & { file?: Express.Multer.File };
    if (!multerReq.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const { title, description, courseId } = req.body as { title?: string; description?: string; courseId?: string };
    if (!title || !courseId) {
      return res.status(400).json({ error: "title and courseId are required" });
    }
    const parsedCourseId = parseInt(courseId);
    if (isNaN(parsedCourseId)) {
      return res.status(400).json({ error: "courseId must be a number" });
    }
    const userRecord = await prisma.user.findUnique({ where: { id: userId! }, select: { academicStaffId: true } });
    if (!userRecord?.academicStaffId) {
      return res.status(403).json({ error: "Academic staff record not found for this user" });
    }
    try {
      const material = await uploadMaterial({
        title,
        description,
        fileUrl: multerReq.file!.path,
        originalName: multerReq.file!.originalname,
        courseId: parsedCourseId,
        academicStaffId: userRecord.academicStaffId,
      });
      return res.status(201).json(material);
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : "Upload failed" });
    }
  },
);

materialsRouter.get("/course/:courseId", authenticate, async (req, res) => {
  const courseId = parseInt(req.params.courseId as string);
  if (isNaN(courseId)) {
    return res.status(400).json({ error: "courseId must be a number" });
  }
  const materials = await getMaterialsForCourse(courseId);
  return res.json(materials);
});

materialsRouter.get("/staff-courses", authenticate, async (req, res) => {
  const { userId, role } = (req as AuthenticatedRequest).user;
  if (!STAFF_ROLES.includes(role)) {
    return res.status(403).json({ error: "Only academic staff can access this endpoint" });
  }
  const userRecord = await prisma.user.findUnique({ where: { id: userId! }, select: { academicStaffId: true } });
  if (!userRecord?.academicStaffId) {
    return res.status(403).json({ error: "Academic staff record not found" });
  }
  const courses = await getCoursesForStaff(userRecord.academicStaffId);
  return res.json(courses);
});

materialsRouter.get("/my", authenticate, async (req, res) => {
  const { userId, role } = (req as AuthenticatedRequest).user;
  if (!STAFF_ROLES.includes(role)) {
    return res.status(403).json({ error: "Only academic staff can access this endpoint" });
  }
  const userRecord = await prisma.user.findUnique({ where: { id: userId! }, select: { academicStaffId: true } });
  if (!userRecord?.academicStaffId) {
    return res.status(403).json({ error: "Academic staff record not found" });
  }
  const materials = await getMaterialsByStaff(userRecord.academicStaffId);
  return res.json(materials);
});

materialsRouter.delete("/:id", authenticate, async (req, res) => {
  const { userId, role } = (req as AuthenticatedRequest).user;
  if (!STAFF_ROLES.includes(role)) {
    return res.status(403).json({ error: "Only academic staff can delete materials" });
  }
  const materialId = parseInt(req.params.id as string);
  if (isNaN(materialId)) {
    return res.status(400).json({ error: "id must be a number" });
  }
  const userRecord = await prisma.user.findUnique({ where: { id: userId! }, select: { academicStaffId: true } });
  if (!userRecord?.academicStaffId) {
    return res.status(403).json({ error: "Academic staff record not found" });
  }
  const result = await deleteMaterial(materialId, userRecord.academicStaffId);
  if ("error" in result) {
    return res.status(result.status).json({ error: result.error });
  }
  return res.json({ success: true });
});

materialsRouter.get("/courses", authenticate, async (req, res) => {
  const { userId, role } = (req as AuthenticatedRequest).user;
  if (role !== "СТУДЕНТ") {
    return res.status(403).json({ error: "Only students can access this endpoint" });
  }
  const userRecord = await prisma.user.findUnique({ where: { id: userId! }, select: { studentId: true } });
  if (!userRecord?.studentId) {
    return res.status(403).json({ error: "Student record not found" });
  }
  const result = await getCoursesWithMaterialsForStudent(userRecord.studentId);
  if (!result) {
    return res.status(404).json({ error: "Student not enrolled in current semester" });
  }
  return res.json(result);
});
