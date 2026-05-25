import { prisma } from "../prisma.ts";

export async function createAnnouncement(
  userId: number,
  body: { message: string; type?: string; validTo: string; courseId?: number; specialtyId: number; year: number; group?: number },
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
    orderBy: [{ year: "desc" }, { startDate: "desc" }],
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
      specialtyId: body.specialtyId,
      year: body.year,
      group: body.group ?? null,
      semesterId: currentSemester.id,
    },
    select: {
      id: true,
      message: true,
      type: true,
      validTo: true,
      createdAt: true,
      course: { select: { code: true, name: true } },
      specialty: { select: { name: true } },
      year: true,
      group: true,
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
      student: { select: { specialtyId: true, year: true, group: true } },
      academicStaff: { select: { id: true } },
    },
  });

  if (!user) {
    return { error: "User not found", status: 404 };
  }

  const now = new Date();

  if (user.student) {
    const announcements = await prisma.announcement.findMany({
      where: {
        specialtyId: user.student.specialtyId,
        year: user.student.year,
        OR: [{ group: null }, { group: user.student.group }],
        validTo: { gte: now },
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
        specialty: { select: { name: true } },
        year: true,
        group: true,
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
  body: { message?: string; type?: string; validTo?: string; courseId?: number | null; specialtyId?: number; year?: number; group?: number | null },
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
      ...(body.specialtyId !== undefined && { specialtyId: body.specialtyId }),
      ...(body.year !== undefined && { year: body.year }),
      ...(body.group !== undefined && { group: body.group }),
    },
    select: {
      id: true,
      message: true,
      type: true,
      validTo: true,
      createdAt: true,
      course: { select: { code: true, name: true } },
      specialty: { select: { name: true } },
      year: true,
      group: true,
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
    select: { id: true, code: true, name: true, specialtyId: true },
    orderBy: { name: "asc" },
  });

  const specialtyIds = [...new Set(courses.map((c) => c.specialtyId))];
  const specialties = await prisma.specialty.findMany({
    where: { id: { in: specialtyIds } },
    select: { id: true, name: true, years: true },
    orderBy: { name: "asc" },
  });

  return { data: { courses, specialties } };
}
