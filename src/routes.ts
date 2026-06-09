import { Router } from "express";
import { authRouter } from "./routes/auth.ts";
import { studentRouter } from "./routes/student.ts";
import { academicStaffRouter } from "./routes/academicStaff.ts";
import { eventsRouter } from "./routes/events.ts";
import { announcementsRouter } from "./routes/announcements.ts";
import { materialsRouter } from "./routes/materials.ts";
import { pushRouter } from "./routes/push.ts";
import { gradesRouter } from "./routes/grades.ts";

export const router = Router();

router.use("/auth", authRouter);
router.use("/student", studentRouter);
router.use("/academic-staff", academicStaffRouter);
router.use("/events", eventsRouter);
router.use("/announcements", announcementsRouter);
router.use("/materials", materialsRouter);
router.use("/push-token", pushRouter);
router.use("/grades", gradesRouter);
