import { prisma } from "../prisma.ts";

export async function getEventsForUser(userId: number): Promise<{ error: string; status: number } | { data: Record<string, unknown> }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      student: { select: { specialtyId: true, year: true, group: true } },
      academicStaff: { select: { id: true } },
    },
  });

  if (!user) {
    return { error: "User not found", status: 404 };
  }

  const currentSemester = await prisma.semester.findFirst({
    where: { isCurrent: true },
    orderBy: [{ year: "desc" }, { startDate: "desc" }],
    select: { id: true },
  });

  if (!currentSemester) {
    return { data: { dates: [], events: [] } };
  }

  let events;

  if (user.student) {
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
    return { error: "No student or staff profile linked", status: 403 };
  }

  const dates = [...new Set(events.map((e) => e.date.toISOString().split("T")[0]))];

  return { data: { dates, events } };
}
