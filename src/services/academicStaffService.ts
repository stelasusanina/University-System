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
          role: true,
          faculty: { select: { name: true } },
        },
      },
    },
  });

  if (!user) {
    return { error: "User not found", status: 404 };
  }
  if (!user.academicStaff) {
    return { error: "Program view is available only for academic staff accounts", status: 403 };
  }

  const currentSemester = await prisma.semester.findFirst({
    where: { isCurrent: true },
    orderBy: [{ startDate: "desc" }],
    select: { id: true, academicYear: true, period: true },
  });

  if (!currentSemester) {
    return { error: "No active semester found", status: 404 };
  }

  const courseGroups = await prisma.courseGroup.findMany({
    where: {
      academicStaffId: user.academicStaff.id,
      semesterId: currentSemester.id,
    },
    select: {
      id: true,
      semesterNum: true,
      course: {
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          credits: true,
        },
      },
      group: { select: { number: true, studyYear: true, specialty: { select: { name: true } } } },
      schedules: {
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        select: { id: true, dayOfWeek: true, startTime: true, endTime: true, room: true, type: true },
      },
    },
    orderBy: [{ course: { name: "asc" } }],
  });

  const { faculty, ...staffData } = user.academicStaff;

  return {
    data: {
      staff: { ...staffData, faculty: faculty.name },
      semester: { ...currentSemester, name: `${currentSemester.academicYear} ${currentSemester.period}` },
      courses: courseGroups.map(({ course, group, schedules, semesterNum }) => ({
        ...course,
        specialty: group.specialty.name,
        group: group.number,
        year: group.studyYear,
        semesterNum,
        schedules,
      })),
    },
  };
}
