import { prisma } from "../prisma.ts";
import { getBuildingNumberFromRoom } from "../utils/buildingUtils.ts";

export async function getStudentProgram(userId: number): Promise<{ error: string; status: number } | { data: Record<string, unknown> }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      student: {
        select: {
          id: true,
          facultyNumber: true,
          firstName: true,
          lastName: true,
          groupId: true,
          group: {
            select: {
              number: true,
              studyYear: true,
              specialty: { select: { name: true, faculty: { select: { name: true } } } },
            },
          },
        },
      },
    },
  });

  if (!user) {
    return { error: "Потребителят не е намерен", status: 404 };
  }
  if (!user.student) {
    return { error: "Програмата е достъпна само за студентски акаунти", status: 403 };
  }

  const currentSemester = await prisma.semester.findFirst({
    where: { isCurrent: true },
    orderBy: [{ startDate: "desc" }],
    select: { id: true, academicYear: true, period: true },
  });

  if (!currentSemester) {
    return { error: "Няма активен семестър", status: 404 };
  }


  const buildings = await prisma.building.findMany({
    select: { number: true, name: true, address: true, latitude: true, longitude: true, googleMapsUrl: true },
  });
  const buildingMap = new Map(buildings.map((b) => [b.number, b]));

  const courseGroups = await prisma.courseGroup.findMany({
    where: {
      groupId: user.student.groupId,
      semesterId: currentSemester.id,
    },
    select: {
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
      academicStaff: {
        select: { firstName: true, lastName: true, role: true },
      },
      schedules: {
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        select: { id: true, dayOfWeek: true, startTime: true, endTime: true, room: true, type: true },
      },
    },
    orderBy: [{ course: { name: "asc" } }],
  });

  return {
    data: {
      student: {
        id: user.student.id,
        facultyNumber: user.student.facultyNumber,
        firstName: user.student.firstName,
        lastName: user.student.lastName,
        year: user.student.group.studyYear,
        group: user.student.group.number,
        specialty: user.student.group.specialty.name,
        faculty: user.student.group.specialty.faculty.name,
      },
      semester: { ...currentSemester, name: `${currentSemester.academicYear} ${currentSemester.period}` },
      courses: courseGroups.map(({ course, academicStaff, schedules }) => ({
        ...course,
        lecturer: academicStaff,
        schedules: schedules.map((schedule) => {
          const num = getBuildingNumberFromRoom(schedule.room);
          return { ...schedule, building: num !== null ? (buildingMap.get(num) ?? null) : null };
        }),
      })),
    },
  };
}
