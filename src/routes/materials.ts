import { Router } from "express";
import type { Request } from "express";
import { authenticate } from "../middleware/auth.ts";
import type { AuthenticatedRequest } from "../middleware/auth.ts";
import { uploadMaterial, getMaterialsForCourse, getMaterialsByStaff, deleteMaterial, getCoursesWithMaterialsForStudent, getCoursesForStaff } from "../services/materialService.ts";
import { upload } from "../utils/upload.ts";
import { prisma } from "../prisma.ts";
import cloudinary from "../utils/cloudinary.ts";

const STAFF_ROLES = ["ПРОФЕСОР", "ДОЦЕНТ", "ГЛАВЕН_АСИСТЕНТ", "АСИСТЕНТ"];

export const materialsRouter = Router();

materialsRouter.get("/signed-url", authenticate, async (req, res) => {
  const { fileUrl } = req.query as { fileUrl?: string };
  if (!fileUrl) return res.status(400).json({ error: "fileUrl is required" });

  const material = await prisma.material.findFirst({ where: { fileUrl } });
  if (!material) return res.status(404).json({ error: "Material not found" });

  const urlObj = new URL(fileUrl);
  const parts = urlObj.pathname.split("/");
  const uploadIndex = parts.indexOf("upload");
  const afterUpload = parts.slice(uploadIndex + 1);
  const withoutVersion = afterUpload[0]?.startsWith("v") ? afterUpload.slice(1) : afterUpload;
  const publicId = withoutVersion.join("/").replace(/\.[^/.]+$/, "");

  console.log("fileUrl:", fileUrl);
  console.log("publicId:", publicId);

  const signedUrl = cloudinary.utils.private_download_url(publicId, material.fileType, {
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    attachment: false,
  });

  return res.json({ url: signedUrl });
});

materialsRouter.post(
  "/",
  authenticate,
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err instanceof Error ? err.message : "Грешка при качване на файл" });
      }
      next();
    });
  },
  async (req, res) => {
    const { userId, role } = (req as AuthenticatedRequest).user;
    if (!STAFF_ROLES.includes(role)) {
      return res.status(403).json({ error: "Само академичен персонал може да качва материали" });
    }
    const multerReq = req as Request & { file?: Express.Multer.File };
    if (!multerReq.file) {
      return res.status(400).json({ error: "Не е качен файл" });
    }
    const { title, description, courseId } = req.body as { title?: string; description?: string; courseId?: string };
    if (!title || !courseId) {
      return res.status(400).json({ error: "Заглавието и идентификаторът на курса са задължителни" });
    }
    const parsedCourseId = parseInt(courseId);
    if (isNaN(parsedCourseId)) {
      return res.status(400).json({ error: "Идентификаторът на курса трябва да е число" });
    }
    const userRecord = await prisma.user.findUnique({ where: { id: userId! }, select: { academicStaffId: true } });
    if (!userRecord?.academicStaffId) {
      return res.status(403).json({ error: "Не е намерен запис на академичен персонал" });
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
      return res.status(500).json({ error: err instanceof Error ? err.message : "Грешка при качване" });
    }
  },
);

materialsRouter.get("/course/:courseId", authenticate, async (req, res) => {
  const courseId = parseInt(req.params.courseId as string);
  if (isNaN(courseId)) {
    return res.status(400).json({ error: "Идентификаторът на курса трябва да е число" });
  }
  const materials = await getMaterialsForCourse(courseId);
  return res.json(materials);
});

materialsRouter.get("/staff-courses", authenticate, async (req, res) => {
  const { userId, role } = (req as AuthenticatedRequest).user;
  if (!STAFF_ROLES.includes(role)) {
    return res.status(403).json({ error: "Само академичен персонал може да достъпи тази функционалност" });
  }
  const userRecord = await prisma.user.findUnique({ where: { id: userId! }, select: { academicStaffId: true } });
  if (!userRecord?.academicStaffId) {
    return res.status(403).json({ error: "Не е намерен запис на академичен персонал" });
  }
  const courses = await getCoursesForStaff(userRecord.academicStaffId);
  return res.json(courses);
});

materialsRouter.get("/my", authenticate, async (req, res) => {
  const { userId, role } = (req as AuthenticatedRequest).user;
  if (!STAFF_ROLES.includes(role)) {
    return res.status(403).json({ error: "Само академичен персонал може да достъпи тази функционалност" });
  }
  const userRecord = await prisma.user.findUnique({ where: { id: userId! }, select: { academicStaffId: true } });
  if (!userRecord?.academicStaffId) {
    return res.status(403).json({ error: "Не е намерен запис на академичен персонал" });
  }
  const materials = await getMaterialsByStaff(userRecord.academicStaffId);
  return res.json(materials);
});

materialsRouter.delete("/:id", authenticate, async (req, res) => {
  const { userId, role } = (req as AuthenticatedRequest).user;
  if (!STAFF_ROLES.includes(role)) {
    return res.status(403).json({ error: "Само академичен персонал може да изтрива материали" });
  }
  const materialId = parseInt(req.params.id as string);
  if (isNaN(materialId)) {
    return res.status(400).json({ error: "Идентификаторът трябва да е число" });
  }
  const userRecord = await prisma.user.findUnique({ where: { id: userId! }, select: { academicStaffId: true } });
  if (!userRecord?.academicStaffId) {
    return res.status(403).json({ error: "Не е намерен запис на академичен персонал" });
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
    return res.status(403).json({ error: "Само студенти могат да достъпят тази функционалност" });
  }
  const userRecord = await prisma.user.findUnique({ where: { id: userId! }, select: { studentId: true } });
  if (!userRecord?.studentId) {
    return res.status(403).json({ error: "Не е намерен запис на студент" });
  }
  const result = await getCoursesWithMaterialsForStudent(userRecord.studentId);
  if (!result) {
    return res.status(404).json({ error: "Студентът не е записан в текущия семестър" });
  }
  return res.json(result);
});
