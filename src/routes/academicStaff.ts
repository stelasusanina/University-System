import { Router } from "express";
import { prisma } from "../prisma.ts";
import { authenticate } from "../middleware/auth.ts";
import type { AuthenticatedRequest } from "../middleware/auth.ts";

export const academicStaffRouter = Router();

academicStaffRouter.get("/program", authenticate, async (req, res) => {
  const { userId } = (req as AuthenticatedRequest).user;

  if (!userId) {
    return res.status(401).json({ error: "Invalid token payload" });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      academicStaff: {
        include: {
          faculty: true,
        },
      },
    },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (!user.academicStaff) {
    return res.status(403).json({ error: "Program view is available only for academic staff accounts" });
  }

  const currentSemester = await prisma.semester.findFirst({
    where: { isCurrent: true },
    orderBy: [{ year: "desc" }, { startDate: "desc" }],
  });

  if (!currentSemester) {
    return res.status(404).json({ error: "No active semester found" });
  }

  const courses = await prisma.course.findMany({
    where: {
      academicStaffId: user.academicStaff.id,
      schedules: {
        some: { semesterId: currentSemester.id },
      },
    },
    include: {
      specialty: true,
      schedules: {
        where: { semesterId: currentSemester.id },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      },
    },
    orderBy: [{ name: "asc" }],
  });

  return res.json({
    staff: {
      id: user.academicStaff.id,
      staffNumber: user.academicStaff.staffNumber,
      firstName: user.academicStaff.firstName,
      lastName: user.academicStaff.lastName,
      title: user.academicStaff.title,
      faculty: user.academicStaff.faculty.name,
    },
    semester: {
      id: currentSemester.id,
      name: currentSemester.name,
      year: currentSemester.year,
      period: currentSemester.period,
    },
    courses: courses.map((course) => ({
      id: course.id,
      code: course.code,
      name: course.name,
      description: course.description,
      credits: course.credits,
      type: course.type,
      specialty: course.specialty.name,
      schedules: course.schedules.map((schedule) => ({
        id: schedule.id,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        room: schedule.room,
        type: schedule.type,
      })),
    })),
  });
});
