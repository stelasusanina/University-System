import { Router } from "express";
import { authenticate } from "./middleware/auth.ts";
import type { AuthenticatedRequest } from "./middleware/auth.ts";
import { loginUser, registerUser } from "./services/authService.ts";
import { getStudentProgram } from "./services/studentService.ts";
import { getAcademicStaffProgram } from "./services/academicStaffService.ts";
import { getEventsForUser } from "./services/eventService.ts";
import { createAnnouncement, getAnnouncementsForUser, updateAnnouncement, deleteAnnouncement, getStaffFormOptions } from "./services/announcementService.ts";
import { uploadMaterial, getMaterialsForCourse } from "./services/materialService.ts";
import { upload } from "./utils/upload.ts";
import { prisma } from "./prisma.ts";
import type { Request } from "express";

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

// ── Announcements ────────────────────────────────────

router.post("/announcements", authenticate, async (req, res) => {
  const { userId } = (req as AuthenticatedRequest).user;

  if (!userId) {
    return res.status(401).json({ error: "Invalid token payload" });
  }

  const { message, type, validTo, courseId, specialtyId, year, group } = req.body;

  if (!message || !validTo || !specialtyId || !year) {
    return res.status(400).json({ error: "message, validTo, specialtyId, and year are required" });
  }

  const result = await createAnnouncement(userId, { message, type, validTo, courseId, specialtyId, year, group });

  if ("error" in result) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.status(result.status).json(result.data);
});

router.get("/announcements", authenticate, async (req, res) => {
  const { userId } = (req as AuthenticatedRequest).user;

  if (!userId) {
    return res.status(401).json({ error: "Invalid token payload" });
  }

  const result = await getAnnouncementsForUser(userId);

  if ("error" in result) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.json(result.data);
});

router.get("/announcements/form-options", authenticate, async (req, res) => {
  const { userId } = (req as AuthenticatedRequest).user;

  if (!userId) {
    return res.status(401).json({ error: "Invalid token payload" });
  }

  const result = await getStaffFormOptions(userId);

  if ("error" in result) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.json(result.data);
});

router.put("/announcements/:id", authenticate, async (req, res) => {
  const { userId } = (req as AuthenticatedRequest).user;

  if (!userId) {
    return res.status(401).json({ error: "Invalid token payload" });
  }

  const announcementId = parseInt(req.params.id as string);
  const result = await updateAnnouncement(userId, announcementId, req.body);

  if ("error" in result) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.json(result.data);
});

router.delete("/announcements/:id", authenticate, async (req, res) => {
  const { userId } = (req as AuthenticatedRequest).user;

  if (!userId) {
    return res.status(401).json({ error: "Invalid token payload" });
  }

  const announcementId = parseInt(req.params.id as string);
  const result = await deleteAnnouncement(userId, announcementId);

  if ("error" in result) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.json({ success: true });
});

// ── Materials ────────────────────────────────────────────────────────────────

// Staff: upload a file for a course
router.post(
  "/materials",
  authenticate,
  upload.single("file"),
  async (req, res) => {
    const { userId, role } = (req as AuthenticatedRequest).user;

    const allowedRoles = ["PROFESSOR", "ASSOCIATE_PROFESSOR", "SENIOR_ASSISTANT", "ASSISTANT"];
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ error: "Only academic staff can upload materials" });
    }

    const multerReq = req as Request & { file?: Express.Multer.File };
    if (!multerReq.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { title, description, courseId } = req.body as {
      title?: string;
      description?: string;
      courseId?: string;
    };

    if (!title || !courseId) {
      return res.status(400).json({ error: "title and courseId are required" });
    }

    const parsedCourseId = parseInt(courseId);
    if (isNaN(parsedCourseId)) {
      return res.status(400).json({ error: "courseId must be a number" });
    }

    // Resolve academicStaffId from userId
    const userRecord = await prisma.user.findUnique({
      where: { id: userId! },
      select: { academicStaffId: true },
    });

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

// Anyone authenticated: list materials for a course
router.get("/materials/course/:courseId", authenticate, async (req, res) => {
  const courseId = parseInt(req.params.courseId as string);
  if (isNaN(courseId)) {
    return res.status(400).json({ error: "courseId must be a number" });
  }

  const materials = await getMaterialsForCourse(courseId);
  return res.json(materials);
});
