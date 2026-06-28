import { prisma } from "../prisma.ts";

export async function createAnnouncement(
  userId: number,
  body: { message: string; type?: string; validTo: string; courseGroupId?: number },
): Promise<{ error: string; status: number } | { data: Record<string, unknown>; status: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { academicStaff: { select: { id: true } } },
  });

  if (!user?.academicStaff) {
    return { error: "Само академичен персонал може да създава обявления", status: 403 };
  }

  const announcement = await prisma.announcement.create({
    data: {
      message: body.message,
      type: (body.type as any) ?? "ИНФОРМАЦИЯ",
      validTo: new Date(body.validTo),
      academicStaffId: user.academicStaff.id,
      courseGroupId: body.courseGroupId ?? null,
    },
    select: {
      id: true,
      message: true,
      type: true,
      validTo: true,
      createdAt: true,
      courseGroup: {
        select: {
          course: { select: { code: true, name: true } },
          group: { select: { number: true, studyYear: true, specialty: { select: { name: true } } } },
        },
      },
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
    return { error: "Потребителят не е намерен", status: 404 };
  }

  const now = new Date();

  if (user.student) {
    const fullStudent = await prisma.student.findUnique({
      where: { id: user.student.id },
      select: { groupId: true },
    });

    const currentSemester = await prisma.semester.findFirst({
      where: { isCurrent: true },
      orderBy: [{ startDate: "desc" }],
      select: { id: true },
    });

    const courseGroupIds = currentSemester && fullStudent
      ? (await prisma.courseGroup.findMany({
          where: { groupId: fullStudent.groupId, semesterId: currentSemester.id },
          select: { id: true },
        })).map((cg) => cg.id)
      : [];

    const announcements = await prisma.announcement.findMany({
      where: {
        validTo: { gte: now },
        OR: [
          { courseGroupId: null },
          { courseGroupId: { in: courseGroupIds } },
        ],
      },
      select: {
        id: true,
        message: true,
        type: true,
        validTo: true,
        createdAt: true,
        updatedAt: true,
        courseGroup: { select: { course: { select: { code: true, name: true } } } },
        academicStaff: { select: { firstName: true, lastName: true, role: true } },
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
        updatedAt: true,
        courseGroup: {
          select: {
            id: true,
            course: { select: { code: true, name: true } },
            group: { select: { number: true, studyYear: true, specialty: { select: { name: true } } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { data: announcements };
  }

  return { error: "Не е намерен свързан профил на студент или персонал", status: 403 };
}

export async function updateAnnouncement(
  userId: number,
  announcementId: number,
  body: { message?: string; type?: string; validTo?: string; courseGroupId?: number | null },
): Promise<{ error: string; status: number } | { data: Record<string, unknown> }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { academicStaff: { select: { id: true } } },
  });

  if (!user?.academicStaff) {
    return { error: "Само академичен персонал може да редактира обявления", status: 403 };
  }

  const existing = await prisma.announcement.findUnique({
    where: { id: announcementId },
    select: { academicStaffId: true },
  });

  if (!existing) {
    return { error: "Обявлението не е намерено", status: 404 };
  }

  if (existing.academicStaffId !== user.academicStaff.id) {
    return { error: "Можете да редактирате само собствените си обявления", status: 403 };
  }

  const announcement = await prisma.announcement.update({
    where: { id: announcementId },
    data: {
      ...(body.message !== undefined && { message: body.message }),
      ...(body.type !== undefined && { type: body.type as any }),
      ...(body.validTo !== undefined && { validTo: new Date(body.validTo) }),
      ...(body.courseGroupId !== undefined && { courseGroupId: body.courseGroupId }),
    },
    select: {
      id: true,
      message: true,
      type: true,
      validTo: true,
      createdAt: true,
      courseGroup: {
        select: {
          course: { select: { code: true, name: true } },
          group: { select: { number: true, studyYear: true, specialty: { select: { name: true } } } },
        },
      },
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
    return { error: "Само академичен персонал може да изтрива обявления", status: 403 };
  }

  const existing = await prisma.announcement.findUnique({
    where: { id: announcementId },
    select: { academicStaffId: true },
  });

  if (!existing) {
    return { error: "Обявлението не е намерено", status: 404 };
  }

  if (existing.academicStaffId !== user.academicStaff.id) {
    return { error: "Можете да изтривате само собствените си обявления", status: 403 };
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
    return { error: "Само академичен персонал може да достъпва тези опции", status: 403 };
  }

  const currentSemester = await prisma.semester.findFirst({
    where: { isCurrent: true },
    orderBy: [{ startDate: "desc" }],
    select: { id: true },
  });

  const courseGroups = await prisma.courseGroup.findMany({
    where: { academicStaffId: user.academicStaff.id, ...(currentSemester && { semesterId: currentSemester.id }) },
    select: {
      id: true,
      semesterNum: true,
      course: { select: { id: true, code: true, name: true } },
      group: { select: { id: true, number: true, studyYear: true, specialty: { select: { id: true, name: true } } } },
    },
    orderBy: [{ course: { name: "asc" } }],
  });

  return { data: { courseGroups } };
}
