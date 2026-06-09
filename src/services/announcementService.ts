import { prisma } from "../prisma.ts";

export async function createAnnouncement(
  userId: number,
  body: { message: string; type?: string; validTo: string; courseId?: number; groupId?: number },
): Promise<{ error: string; status: number } | { data: Record<string, unknown>; status: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { academicStaff: { select: { id: true } } },
  });

  if (!user?.academicStaff) {
    return { error: "Only academic staff can create announcements", status: 403 };
  }

  const currentSemester = await prisma.semester.findFirst({
    where: { isCurrent: true },
    orderBy: [{ startDate: "desc" }],
    select: { id: true },
  });

  if (!currentSemester) {
    return { error: "No active semester found", status: 404 };
  }

  const announcement = await prisma.announcement.create({
    data: {
      message: body.message,
      type: (body.type as any) ?? "ИНФОРМАЦИЯ",
      validTo: new Date(body.validTo),
      academicStaffId: user.academicStaff.id,
      courseId: body.courseId ?? null,
      groupId: body.groupId ?? null,
      semesterId: currentSemester.id,
    },
    select: {
      id: true,
      message: true,
      type: true,
      validTo: true,
      createdAt: true,
      course: { select: { code: true, name: true } },
      group: { select: { number: true, year: true, specialty: { select: { name: true } } } },
    },
  });

  return { data: announcement, status: 201 };
}

export async function getAnnouncementsForUser(
  userId: number,
): Promise<{ error: string; status: number } | { data: Record<string, unknown>[] }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      student: { select: { id: true } },
      academicStaff: { select: { id: true } },
    },
  });

  if (!user) {
    return { error: "User not found", status: 404 };
  }

  const now = new Date();

  if (user.student) {
    const currentSemester = await prisma.semester.findFirst({
      where: { isCurrent: true },
      orderBy: [{ startDate: "desc" }],
      select: { id: true },
    });

    const studentSemester = currentSemester
      ? await prisma.studentSemester.findUnique({
          where: { studentId_semesterId: { studentId: user.student.id, semesterId: currentSemester.id } },
          select: { groupId: true },
        })
      : null;

    const announcements = await prisma.announcement.findMany({
      where: {
        validTo: { gte: now },
        OR: [
          { groupId: null },
          ...(studentSemester ? [{ groupId: studentSemester.groupId }] : []),
        ],
      },
      select: {
        id: true,
        message: true,
        type: true,
        validTo: true,
        createdAt: true,
        course: { select: { code: true, name: true } },
        academicStaff: { select: { firstName: true, lastName: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return { data: announcements };
  }

  if (user.academicStaff) {
    const announcements = await prisma.announcement.findMany({
      where: {
        academicStaffId: user.academicStaff.id,
        validTo: { gte: now },
      },
      select: {
        id: true,
        message: true,
        type: true,
        validTo: true,
        createdAt: true,
        course: { select: { code: true, name: true } },
        group: { select: { number: true, year: true, specialty: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return { data: announcements };
  }

  return { error: "No student or staff profile linked", status: 403 };
}

export async function updateAnnouncement(
  userId: number,
  announcementId: number,
  body: { message?: string; type?: string; validTo?: string; courseId?: number | null; groupId?: number | null },
): Promise<{ error: string; status: number } | { data: Record<string, unknown> }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { academicStaff: { select: { id: true } } },
  });

  if (!user?.academicStaff) {
    return { error: "Only academic staff can update announcements", status: 403 };
  }

  const existing = await prisma.announcement.findUnique({
    where: { id: announcementId },
    select: { academicStaffId: true },
  });

  if (!existing) {
    return { error: "Announcement not found", status: 404 };
  }

  if (existing.academicStaffId !== user.academicStaff.id) {
    return { error: "You can only edit your own announcements", status: 403 };
  }

  const announcement = await prisma.announcement.update({
    where: { id: announcementId },
    data: {
      ...(body.message !== undefined && { message: body.message }),
      ...(body.type !== undefined && { type: body.type as any }),
      ...(body.validTo !== undefined && { validTo: new Date(body.validTo) }),
      ...(body.courseId !== undefined && { courseId: body.courseId }),
      ...(body.groupId !== undefined && { groupId: body.groupId }),
    },
    select: {
      id: true,
      message: true,
      type: true,
      validTo: true,
      createdAt: true,
      course: { select: { code: true, name: true } },
      group: { select: { number: true, year: true, specialty: { select: { name: true } } } },
    },
  });

  return { data: announcement };
}

export async function deleteAnnouncement(
  userId: number,
  announcementId: number,
): Promise<{ error: string; status: number } | { success: true }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { academicStaff: { select: { id: true } } },
  });

  if (!user?.academicStaff) {
    return { error: "Only academic staff can delete announcements", status: 403 };
  }

  const existing = await prisma.announcement.findUnique({
    where: { id: announcementId },
    select: { academicStaffId: true },
  });

  if (!existing) {
    return { error: "Announcement not found", status: 404 };
  }

  if (existing.academicStaffId !== user.academicStaff.id) {
    return { error: "You can only delete your own announcements", status: 403 };
  }

  await prisma.announcement.delete({ where: { id: announcementId } });
  return { success: true };
}

export async function getStaffFormOptions(
  userId: number,
): Promise<{ error: string; status: number } | { data: Record<string, unknown> }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { academicStaff: { select: { id: true } } },
  });

  if (!user?.academicStaff) {
    return { error: "Only academic staff can access form options", status: 403 };
  }

  const courses = await prisma.course.findMany({
    where: { academicStaffId: user.academicStaff.id },
    select: {
      id: true,
      code: true,
      name: true,
      courseGroups: {
        select: {
          id: true,
          curriculumSemester: true,
          group: { select: { id: true, number: true, year: true, specialtyId: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const groupIds = [...new Set(courses.flatMap((c) => c.courseGroups.map((cg) => cg.group.id)))];
  const groups = await prisma.group.findMany({
    where: { id: { in: groupIds } },
    select: { id: true, number: true, year: true, specialty: { select: { id: true, name: true } } },
    orderBy: [{ year: "asc" }, { number: "asc" }],
  });

  return { data: { courses, groups } };
}
