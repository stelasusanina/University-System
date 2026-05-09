import { prisma } from "../prisma.ts";

export async function getAcademicStaffProgram(userId: number): Promise<{ error: string; status: number } | { data: Record<string, unknown> }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      academicStaff: {
        select: {
          id: true,
          staffNumber: true,
          firstName: true,
          lastName: true,
          title: true,
          faculty: { select: { name: true } },
        },
      },
    },
  });

  if (!user) return { error: "User not found", status: 404 };
  if (!user.academicStaff) return { error: "Program view is available only for academic staff accounts", status: 403 };

  const currentSemester = await prisma.semester.findFirst({
    where: { isCurrent: true },
    orderBy: [{ year: "desc" }, { startDate: "desc" }],
    select: { id: true, name: true, year: true, period: true },
  });

  if (!currentSemester) return { error: "No active semester found", status: 404 };

  const courses = await prisma.course.findMany({
    where: {
      academicStaffId: user.academicStaff.id,
      schedules: { some: { semesterId: currentSemester.id } },
    },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      credits: true,
      type: true,
      specialty: { select: { name: true } },
      schedules: {
        where: { semesterId: currentSemester.id },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        select: { id: true, dayOfWeek: true, startTime: true, endTime: true, room: true, type: true },
      },
    },
    orderBy: [{ name: "asc" }],
  });

  const { faculty, ...staffData } = user.academicStaff;

  return {
    data: {
      staff: { ...staffData, faculty: faculty.name },
      semester: currentSemester,
      courses: courses.map(({ specialty, ...course }) => ({
        ...course,
        specialty: specialty.name,
      })),
    },
  };
}
