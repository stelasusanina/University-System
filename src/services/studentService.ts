import { prisma } from "../prisma.ts";

function getBuildingNumberFromRoom(room: string): number | null {
  const digits = room.replace(/\D/g, "");
  if (digits.length === 5) {
    return parseInt(digits.substring(0, 2), 10);
  }
  if (digits.length === 4) {
    return parseInt(digits.charAt(0), 10);
  }
  return null;
}

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
        },
      },
    },
  });

  if (!user) {
    return { error: "User not found", status: 404 };
  }
  if (!user.student) {
    return { error: "Program view is available only for student accounts", status: 403 };
  }

  const currentSemester = await prisma.semester.findFirst({
    where: { isCurrent: true },
    orderBy: [{ startDate: "desc" }],
    select: { id: true, name: true, period: true },
  });

  if (!currentSemester) {
    return { error: "No active semester found", status: 404 };
  }

  const studentSemester = await prisma.studentSemester.findUnique({
    where: { studentId_semesterId: { studentId: user.student.id, semesterId: currentSemester.id } },
    select: {
      groupId: true,
      group: {
        select: {
          number: true,
          year: true,
          specialty: { select: { name: true, faculty: { select: { name: true } } } },
        },
      },
    },
  });

  if (!studentSemester) {
    return { error: "Student is not enrolled in the current semester", status: 404 };
  }

  const curriculumSemester = (studentSemester.group.year - 1) * 2 + (currentSemester.period === "WINTER" ? 1 : 2);

  const buildings = await prisma.building.findMany({
    select: { number: true, name: true, address: true, latitude: true, longitude: true, googleMapsUrl: true },
  });
  const buildingMap = new Map(buildings.map((b) => [b.number, b]));

  const courseGroups = await prisma.courseGroup.findMany({
    where: {
      groupId: studentSemester.groupId,
      curriculumSemester,
    },
    select: {
      course: {
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          credits: true,
          type: true,
          academicStaff: {
            select: { firstName: true, lastName: true, title: true },
          },
          schedules: {
            where: { semesterId: currentSemester.id },
            orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
            select: { id: true, dayOfWeek: true, startTime: true, endTime: true, room: true, type: true },
          },
        },
      },
    },
    orderBy: [{ course: { name: "asc" } }],
  });

  return {
    data: {
      student: {
        ...user.student,
        year: studentSemester.group.year,
        group: studentSemester.group.number,
        specialty: studentSemester.group.specialty.name,
        faculty: studentSemester.group.specialty.faculty.name,
      },
      semester: currentSemester,
      courses: courseGroups.map(({ course }) => {
        const { academicStaff, schedules, ...courseData } = course;
        return {
          ...courseData,
          lecturer: academicStaff,
          schedules: schedules.map((schedule) => {
            const num = getBuildingNumberFromRoom(schedule.room);
            return { ...schedule, building: num !== null ? (buildingMap.get(num) ?? null) : null };
          }),
        };
      }),
    },
  };
}
