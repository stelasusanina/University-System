import { prisma } from "../prisma.ts";

export async function getCoursesWithStudents(
  academicStaffId: number,
): Promise<{ error: string; status: number } | { data: unknown }> {
  const currentSemester = await prisma.semester.findFirst({
    where: { isCurrent: true },
    orderBy: [{ startDate: "desc" }],
    select: { id: true, name: true },
  });
  if (!currentSemester) {
    return { error: "No active semester found", status: 404 };
  }

  const courses = await prisma.course.findMany({
    where: {
      academicStaffId,
      schedules: { some: { semesterId: currentSemester.id } },
    },
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      code: true,
      name: true,
      courseGroups: {
        select: {
          id: true,
          curriculumSemester: true,
          group: { select: { id: true, number: true, year: true, specialty: { select: { name: true } } } },
          _count: {
            select: {
              grades: true,
            },
          },
        },
      },
    },
  });

  return { data: { semester: currentSemester, courses } };
}

export async function getStudentsForCourseGroup(
  courseGroupId: number,
  academicStaffId: number,
): Promise<{ error: string; status: number } | { data: unknown }> {
  const courseGroup = await prisma.courseGroup.findUnique({
    where: { id: courseGroupId },
    select: {
      id: true,
      curriculumSemester: true,
      course: { select: { id: true, code: true, name: true, academicStaffId: true } },
      group: { select: { id: true, number: true, year: true } },
    },
  });

  if (!courseGroup) {
    return { error: "CourseGroup not found", status: 404 };
  }
  if (courseGroup.course.academicStaffId !== academicStaffId) {
    return { error: "You are not the lecturer for this course", status: 403 };
  }

  const currentSemester = await prisma.semester.findFirst({
    where: { isCurrent: true },
    orderBy: [{ startDate: "desc" }],
    select: { id: true, name: true },
  });
  if (!currentSemester) {
    return { error: "No active semester found", status: 404 };
  }

  const studentSemesters = await prisma.studentSemester.findMany({
    where: {
      groupId: courseGroup.group.id,
      semesterId: currentSemester.id,
    },
    orderBy: [{ student: { lastName: "asc" } }, { student: { firstName: "asc" } }],
    select: {
      student: {
        select: {
          id: true,
          facultyNumber: true,
          firstName: true,
          lastName: true,
          grades: {
            where: { courseGroupId },
            select: { id: true, finalGrade: true },
          },
        },
      },
    },
  });

  const students = studentSemesters.map(({ student }) => ({
    id: student.id,
    facultyNumber: student.facultyNumber,
    firstName: student.firstName,
    lastName: student.lastName,
    grade: student.grades[0] ?? null,
  }));

  return {
    data: {
      courseGroup,
      semester: currentSemester,
      students,
    },
  };
}

export async function setGrade(
  studentId: number,
  courseGroupId: number,
  academicStaffId: number,
  finalGrade: number | null,
): Promise<{ error: string; status: number } | { data: unknown }> {
  const courseGroup = await prisma.courseGroup.findUnique({
    where: { id: courseGroupId },
    select: { course: { select: { academicStaffId: true } } },
  });
  if (!courseGroup) {
    return { error: "CourseGroup not found", status: 404 };
  }
  if (courseGroup.course.academicStaffId !== academicStaffId) {
    return { error: "You are not the lecturer for this course", status: 403 };
  }

  if (finalGrade !== null && (finalGrade < 2 || finalGrade > 6)) {
    return { error: "Grade must be between 2 and 6", status: 400 };
  }

  if (finalGrade === null) {
    await prisma.grade.deleteMany({ where: { studentId, courseGroupId } });
    return { data: { studentId, courseGroupId, finalGrade: null } };
  }

  const grade = await prisma.grade.upsert({
    where: { studentId_courseGroupId: { studentId, courseGroupId } },
    create: { studentId, courseGroupId, finalGrade },
    update: { finalGrade },
    select: {
      id: true,
      finalGrade: true,
      student: { select: { firstName: true, lastName: true, facultyNumber: true } },
    },
  });

  return { data: grade };
}

export async function getMyGrades(
  studentId: number,
): Promise<{ error: string; status: number } | { data: unknown }> {
  const studentSemesters = await prisma.studentSemester.findMany({
    where: { studentId },
    orderBy: [{ semester: { startDate: "desc" } }],
    select: {
      id: true,
      curriculumSemester: true,
      semester: { select: { id: true, name: true, period: true } },
      group: { select: { number: true, year: true, specialty: { select: { name: true } } } },
    },
  });

  const grades = await prisma.grade.findMany({
    where: { studentId },
    select: {
      id: true,
      finalGrade: true,
      courseGroup: {
        select: {
          id: true,
          curriculumSemester: true,
          course: {
            select: {
              id: true,
              code: true,
              name: true,
              credits: true,
              type: true,
              academicStaff: { select: { firstName: true, lastName: true, title: true } },
            },
          },
        },
      },
    },
  });

  const gradesByCurriculumSemester = new Map<number, typeof grades>();
  for (const g of grades) {
    const cs = g.courseGroup.curriculumSemester;
    if (!gradesByCurriculumSemester.has(cs)) {
      gradesByCurriculumSemester.set(cs, []);
    }
    gradesByCurriculumSemester.get(cs)!.push(g);
  }

  const semesters = studentSemesters.map((ss) => ({
    semester: ss.semester,
    curriculumSemester: ss.curriculumSemester,
    group: ss.group,
    grades: (gradesByCurriculumSemester.get(ss.curriculumSemester) ?? []).map((g) => ({
      id: g.id,
      finalGrade: g.finalGrade,
      course: g.courseGroup.course,
    })),
  }));

  return { data: { semesters } };
}
