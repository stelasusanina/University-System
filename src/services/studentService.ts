import { prisma } from "../prisma.ts";
import { getBuildingNumberFromRoom } from "../utils/building.ts";

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
          year: true,
          group: true,
          specialty: {
            select: {
              name: true,
              faculty: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!user) return { error: "User not found", status: 404 };
  if (!user.student) return { error: "Program view is available only for student accounts", status: 403 };

  const currentSemester = await prisma.semester.findFirst({
    where: { isCurrent: true },
    orderBy: [{ year: "desc" }, { startDate: "desc" }],
    select: { id: true, name: true, year: true, period: true },
  });

  if (!currentSemester) return { error: "No active semester found", status: 404 };

  const buildings = await prisma.building.findMany({
    select: { number: true, name: true, address: true, latitude: true, longitude: true, googleMapsUrl: true },
  });
  const buildingMap = new Map(buildings.map((b) => [b.number, b]));

  const enrollments = await prisma.enrollment.findMany({
    where: {
      studentId: user.student.id,
      semesterId: currentSemester.id,
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
    orderBy: [{ courseId: "asc" }],
  });

  const { specialty, ...studentData } = user.student;

  return {
    data: {
      student: { ...studentData, specialty: specialty.name, faculty: specialty.faculty.name },
      semester: currentSemester,
      courses: enrollments.map(({ course }) => {
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
