import { Router } from "express";
import { authenticate } from "./middleware/auth.ts";
import type { AuthenticatedRequest } from "./middleware/auth.ts";
import { loginUser, registerUser } from "./services/authService.ts";
import { getStudentProgram } from "./services/studentService.ts";
import { getAcademicStaffProgram } from "./services/academicStaffService.ts";
import { getEventsForUser, createEvent, deleteEvent } from "./services/eventService.ts";
import { createAnnouncement, getAnnouncementsForUser, updateAnnouncement, deleteAnnouncement, getStaffFormOptions } from "./services/announcementService.ts";
import { uploadMaterial, getMaterialsForCourse, getMaterialsByStaff, deleteMaterial, getCoursesWithMaterialsForStudent, getCoursesForStaff } from "./services/materialService.ts";
import { getEnrollmentsForCourse, getCoursesWithEnrollments, setGrade, getMyGrades } from "./services/gradeService.ts";
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

router.get("/events/form-options", authenticate, async (req, res) => {
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

router.post("/events", authenticate, async (req, res) => {
  const { userId } = (req as AuthenticatedRequest).user;

  if (!userId) {
    return res.status(401).json({ error: "Invalid token payload" });
  }

  const { title, type, date, startTime, endTime, room, courseId, specialtyId, year, group } = req.body;

  if (!title || !type || !date || !courseId || !specialtyId || !year) {
    return res.status(400).json({ error: "title, type, date, courseId, specialtyId, and year are required" });
  }

  const result = await createEvent(userId, { title, type, date, startTime, endTime, room, courseId, specialtyId, year, group });

  if ("error" in result) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.status(result.status).json(result.data);
});

router.delete("/events/:id", authenticate, async (req, res) => {
  const { userId } = (req as AuthenticatedRequest).user;

  if (!userId) {
    return res.status(401).json({ error: "Invalid token payload" });
  }

  const eventId = parseInt(req.params.id as string);
  const result = await deleteEvent(userId, eventId);

  if ("error" in result) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.json({ success: true });
});

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

// Staff: list all courses they can upload materials to
router.get("/materials/staff-courses", authenticate, async (req, res) => {
  const { userId, role } = (req as AuthenticatedRequest).user;

  const allowedRoles = ["PROFESSOR", "ASSOCIATE_PROFESSOR", "SENIOR_ASSISTANT", "ASSISTANT"];
  if (!allowedRoles.includes(role)) {
    return res.status(403).json({ error: "Only academic staff can access this endpoint" });
  }

  const userRecord = await prisma.user.findUnique({
    where: { id: userId! },
    select: { academicStaffId: true },
  });

  if (!userRecord?.academicStaffId) {
    return res.status(403).json({ error: "Academic staff record not found" });
  }

  const courses = await getCoursesForStaff(userRecord.academicStaffId);
  return res.json(courses);
});

// Staff: list all materials they have uploaded
router.get("/materials/my", authenticate, async (req, res) => {
  const { userId, role } = (req as AuthenticatedRequest).user;

  const allowedRoles = ["PROFESSOR", "ASSOCIATE_PROFESSOR", "SENIOR_ASSISTANT", "ASSISTANT"];
  if (!allowedRoles.includes(role)) {
    return res.status(403).json({ error: "Only academic staff can access this endpoint" });
  }

  const userRecord = await prisma.user.findUnique({
    where: { id: userId! },
    select: { academicStaffId: true },
  });

  if (!userRecord?.academicStaffId) {
    return res.status(403).json({ error: "Academic staff record not found" });
  }

  const materials = await getMaterialsByStaff(userRecord.academicStaffId);
  return res.json(materials);
});

// Staff: delete own material
router.delete("/materials/:id", authenticate, async (req, res) => {
  const { userId, role } = (req as AuthenticatedRequest).user;

  const allowedRoles = ["PROFESSOR", "ASSOCIATE_PROFESSOR", "SENIOR_ASSISTANT", "ASSISTANT"];
  if (!allowedRoles.includes(role)) {
    return res.status(403).json({ error: "Only academic staff can delete materials" });
  }

  const materialId = parseInt(req.params.id as string);
  if (isNaN(materialId)) {
    return res.status(400).json({ error: "id must be a number" });
  }

  const userRecord = await prisma.user.findUnique({
    where: { id: userId! },
    select: { academicStaffId: true },
  });

  if (!userRecord?.academicStaffId) {
    return res.status(403).json({ error: "Academic staff record not found" });
  }

  const result = await deleteMaterial(materialId, userRecord.academicStaffId);

  if ("error" in result) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.json({ success: true });
});

// Student: list enrolled courses with their materials for current semester
router.get("/materials/courses", authenticate, async (req, res) => {
  const { userId, role } = (req as AuthenticatedRequest).user;

  if (role !== "STUDENT") {
    return res.status(403).json({ error: "Only students can access this endpoint" });
  }

  const userRecord = await prisma.user.findUnique({
    where: { id: userId! },
    select: { studentId: true },
  });

  if (!userRecord?.studentId) {
    return res.status(403).json({ error: "Student record not found" });
  }

  const result = await getCoursesWithMaterialsForStudent(userRecord.studentId);

  if (!result) {
    return res.status(404).json({ error: "No active semester found" });
  }

  return res.json(result);
});

// ── Grades ────────────────────────────────────────────────────────────────────

const STAFF_ROLES_GRADES = ["PROFESSOR", "ASSOCIATE_PROFESSOR", "SENIOR_ASSISTANT", "ASSISTANT"];

// Staff: list their courses (current semester) for the grades overview
router.get("/grades/courses", authenticate, async (req, res) => {
  const { userId, role } = (req as AuthenticatedRequest).user;
  if (!STAFF_ROLES_GRADES.includes(role)) {
    return res.status(403).json({ error: "Only academic staff can access grades" });
  }
  const userRecord = await prisma.user.findUnique({ where: { id: userId! }, select: { academicStaffId: true } });
  if (!userRecord?.academicStaffId) return res.status(403).json({ error: "Academic staff record not found" });

  const result = await getCoursesWithEnrollments(userRecord.academicStaffId);
  if ("error" in result) return res.status(result.status).json({ error: result.error });
  return res.json(result.data);
});

// Staff: get all enrollments for one of their courses
router.get("/grades/course/:courseId", authenticate, async (req, res) => {
  const { userId, role } = (req as AuthenticatedRequest).user;
  if (!STAFF_ROLES_GRADES.includes(role)) {
    return res.status(403).json({ error: "Only academic staff can access grades" });
  }
  const courseId = parseInt(req.params.courseId as string);
  if (isNaN(courseId)) return res.status(400).json({ error: "Invalid courseId" });

  const userRecord = await prisma.user.findUnique({ where: { id: userId! }, select: { academicStaffId: true } });
  if (!userRecord?.academicStaffId) return res.status(403).json({ error: "Academic staff record not found" });

  const result = await getEnrollmentsForCourse(courseId, userRecord.academicStaffId);
  if ("error" in result) return res.status(result.status).json({ error: result.error });
  return res.json(result.data);
});

// Staff: set or update a grade
router.put("/grades/enrollment/:id", authenticate, async (req, res) => {
  const { userId, role } = (req as AuthenticatedRequest).user;
  if (!STAFF_ROLES_GRADES.includes(role)) {
    return res.status(403).json({ error: "Only academic staff can set grades" });
  }
  const enrollmentId = parseInt(req.params.id as string);
  if (isNaN(enrollmentId)) return res.status(400).json({ error: "Invalid enrollment id" });

  const { grade, status } = req.body as { grade?: number | null; status?: string };

  const userRecord = await prisma.user.findUnique({ where: { id: userId! }, select: { academicStaffId: true } });
  if (!userRecord?.academicStaffId) return res.status(403).json({ error: "Academic staff record not found" });

  const result = await setGrade(enrollmentId, userRecord.academicStaffId, grade ?? null, status);
  if ("error" in result) return res.status(result.status).json({ error: result.error });
  return res.json(result.data);
});

// Student: get own grades across all semesters
router.get("/grades/my", authenticate, async (req, res) => {
  const { userId, role } = (req as AuthenticatedRequest).user;
  if (role !== "STUDENT") return res.status(403).json({ error: "Only students can access this endpoint" });

  const userRecord = await prisma.user.findUnique({ where: { id: userId! }, select: { studentId: true } });
  if (!userRecord?.studentId) return res.status(403).json({ error: "Student record not found" });

  const result = await getMyGrades(userRecord.studentId);
  if ("error" in result) return res.status(result.status).json({ error: result.error });
  return res.json(result.data);
});
