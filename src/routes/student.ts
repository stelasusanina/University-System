import { Router } from "express";
import { prisma } from "../prisma.ts";
import { authenticate } from "../middleware/auth.ts";
import type { AuthenticatedRequest } from "../middleware/auth.ts";
import { getBuildingNumberFromRoom } from "../utils/building.ts";

export const studentRouter = Router();

studentRouter.get("/program", authenticate, async (req, res) => {
  const { userId } = (req as AuthenticatedRequest).user;

  if (!userId) {
    return res.status(401).json({ error: "Invalid token payload" });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      student: {
        include: {
          specialty: {
            include: { faculty: true },
          },
        },
      },
    },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (!user.student) {
    return res.status(403).json({ error: "Program view is available only for student accounts" });
  }

  const currentSemester = await prisma.semester.findFirst({
    where: { isCurrent: true },
    orderBy: [{ year: "desc" }, { startDate: "desc" }],
  });

  if (!currentSemester) {
    return res.status(404).json({ error: "No active semester found" });
  }

  const buildings = await prisma.building.findMany();
  const buildingMap = new Map(buildings.map((b) => [b.number, b]));

  const enrollments = await prisma.enrollment.findMany({
    where: {
      studentId: user.student.id,
      semesterId: currentSemester.id,
    },
    include: {
      course: {
        include: {
          academicStaff: true,
          schedules: {
            where: { semesterId: currentSemester.id },
            orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
          },
        },
      },
    },
    orderBy: [{ courseId: "asc" }],
  });

  return res.json({
    student: {
      id: user.student.id,
      facultyNumber: user.student.facultyNumber,
      firstName: user.student.firstName,
      lastName: user.student.lastName,
      year: user.student.year,
      group: user.student.group,
      specialty: user.student.specialty.name,
      faculty: user.student.specialty.faculty.name,
    },
    semester: {
      id: currentSemester.id,
      name: currentSemester.name,
      year: currentSemester.year,
      period: currentSemester.period,
    },
    courses: enrollments.map((enrollment) => ({
      id: enrollment.course.id,
      code: enrollment.course.code,
      name: enrollment.course.name,
      description: enrollment.course.description,
      credits: enrollment.course.credits,
      type: enrollment.course.type,
      status: enrollment.status,
      lecturer: {
        firstName: enrollment.course.academicStaff.firstName,
        lastName: enrollment.course.academicStaff.lastName,
        title: enrollment.course.academicStaff.title,
      },
      schedules: enrollment.course.schedules.map((schedule) => {
        const buildingNum = getBuildingNumberFromRoom(schedule.room);
        const building = buildingNum !== null ? (buildingMap.get(buildingNum) ?? null) : null;
        return {
          id: schedule.id,
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          room: schedule.room,
          type: schedule.type,
          building: building
            ? {
                number: building.number,
                name: building.name,
                address: building.address,
                latitude: building.latitude,
                longitude: building.longitude,
                googleMapsUrl: building.googleMapsUrl,
              }
            : null,
        };
      }),
    })),
  });
});
