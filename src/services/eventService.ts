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
    orderBy: [{ startDate: "desc" }],
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

export async function createEvent(
  userId: number,
  body: {
    title: string;
    type: string;
    date: string;
    startTime?: string;
    endTime?: string;
    room?: string;
    courseId: number;
    specialtyId: number;
    year: number;
    group?: number;
  },
): Promise<{ error: string; status: number } | { data: Record<string, unknown>; status: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { academicStaff: { select: { id: true } } },
  });

  if (!user?.academicStaff) {
    return { error: "Only academic staff can create events", status: 403 };
  }

  const eventDate = new Date(body.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (eventDate < today) {
    return { error: "Не може да се създаде събитие за минала дата!", status: 400 };
  }

  const currentSemester = await prisma.semester.findFirst({
    where: { isCurrent: true },
    orderBy: [{ startDate: "desc" }],
    select: { id: true },
  });

  if (!currentSemester) {
    return { error: "No active semester found", status: 404 };
  }

  const event = await prisma.event.create({
    data: {
      title: body.title,
      type: body.type as any,
      date: new Date(body.date),
      startTime: body.startTime ?? null,
      endTime: body.endTime ?? null,
      room: body.room ?? null,
      courseId: body.courseId,
      academicStaffId: user.academicStaff.id,
      specialtyId: body.specialtyId,
      year: body.year,
      group: body.group ?? null,
      semesterId: currentSemester.id,
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
  });

  return { data: event, status: 201 };
}

export async function deleteEvent(
  userId: number,
  eventId: number,
): Promise<{ error: string; status: number } | { success: boolean }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { academicStaff: { select: { id: true } } },
  });

  if (!user?.academicStaff) {
    return { error: "Only academic staff can delete events", status: 403 };
  }

  const existing = await prisma.event.findUnique({
    where: { id: eventId },
    select: { academicStaffId: true },
  });

  if (!existing) {
    return { error: "Event not found", status: 404 };
  }

  if (existing.academicStaffId !== user.academicStaff.id) {
    return { error: "You can only delete your own events", status: 403 };
  }

  await prisma.event.delete({ where: { id: eventId } });

  return { success: true };
}
