import { Router } from "express";
import { prisma } from "../prisma.ts";
import { authenticate } from "../middleware/auth.ts";
import type { AuthenticatedRequest } from "../middleware/auth.ts";

export const eventsRouter = Router();

// GET /events/dates — returns a list of dates that have events for the current user
eventsRouter.get("/dates", authenticate, async (req, res) => {
  const { userId } = (req as AuthenticatedRequest).user;

  if (!userId) {
    return res.status(401).json({ error: "Invalid token payload" });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      student: true,
      academicStaff: true,
    },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const currentSemester = await prisma.semester.findFirst({
    where: { isCurrent: true },
    orderBy: [{ year: "desc" }, { startDate: "desc" }],
  });

  if (!currentSemester) {
    return res.json({ dates: [] });
  }

  let events;

  if (user.student) {
    // Students see events for their specialty, year, and group
    events = await prisma.event.findMany({
      where: {
        semesterId: currentSemester.id,
        specialtyId: user.student.specialtyId,
        year: user.student.year,
        OR: [
          { group: null },
          { group: user.student.group },
        ],
      },
      select: {
        id: true,
        title: true,
        type: true,
        date: true,
        startTime: true,
        endTime: true,
        room: true,
        course: { select: { code: true, name: true } },
        academicStaff: { select: { firstName: true, lastName: true, title: true } },
      },
      orderBy: { date: "asc" },
    });
  } else if (user.academicStaff) {
    // Staff see events they created
    events = await prisma.event.findMany({
      where: {
        semesterId: currentSemester.id,
        academicStaffId: user.academicStaff.id,
      },
      select: {
        id: true,
        title: true,
        type: true,
        date: true,
        startTime: true,
        endTime: true,
        room: true,
        course: { select: { code: true, name: true } },
        specialty: { select: { name: true } },
        year: true,
        group: true,
      },
      orderBy: { date: "asc" },
    });
  } else {
    return res.status(403).json({ error: "No student or staff profile linked" });
  }

  const dates = [...new Set(events.map((e) => e.date.toISOString().split("T")[0]))];

  return res.json({ dates, events });
});
