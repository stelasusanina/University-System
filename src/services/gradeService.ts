import { prisma } from "../prisma.ts";

export async function getCoursesWithStudents(
  academicStaffId: number,
): Promise<{ error: string; status: number } | { data: unknown }> {
  const currentSemester = await prisma.semester.findFirst({
    where: { isCurrent: true },
    orderBy: [{ startDate: "desc" }],
    select: { id: true, academicYear: true },
  });
  if (!currentSemester) {
    return { error: "No active semester found", status: 404 };
  }

  const courseGroups = await prisma.courseGroup.findMany({
    where: { academicStaffId, semesterId: currentSemester.id },
    orderBy: [{ course: { name: "asc" } }],
    select: {
      id: true,
      semesterNum: true,
      course: { select: { id: true, code: true, name: true } },
      group: { select: { id: true, number: true, studyYear: true, specialty: { select: { name: true } } } },
      _count: { select: { grades: true } },
    },
  });

  const coursesMap = new Map<number, { id: number; code: string; name: string; courseGroups: typeof courseGroups }>();
  for (const cg of courseGroups) {
    if (!coursesMap.has(cg.course.id)) {
      coursesMap.set(cg.course.id, { ...cg.course, courseGroups: [] });
    }
    coursesMap.get(cg.course.id)!.courseGroups.push(cg);
  }

  return { data: { semester: { ...currentSemester, name: currentSemester.academicYear }, courses: Array.from(coursesMap.values()) } };
}

export async function getStudentsForCourseGroup(
  courseGroupId: number,
  academicStaffId: number,
): Promise<{ error: string; status: number } | { data: unknown }> {
  const courseGroup = await prisma.courseGroup.findUnique({
    where: { id: courseGroupId },
    select: {
      id: true,
      semesterNum: true,
      academicStaffId: true,
      course: { select: { id: true, code: true, name: true } },
      group: { select: { id: true, number: true, studyYear: true } },
    },
  });

  if (!courseGroup) {
    return { error: "CourseGroup not found", status: 404 };
  }
  if (courseGroup.academicStaffId !== academicStaffId) {
    return { error: "You are not the lecturer for this course", status: 403 };
  }

  const currentSemester = await prisma.semester.findFirst({
    where: { isCurrent: true },
    orderBy: [{ startDate: "desc" }],
    select: { id: true, academicYear: true },
  });
  if (!currentSemester) {
    return { error: "No active semester found", status: 404 };
  }

  const students = await prisma.student.findMany({
    where: { groupId: courseGroup.group.id },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
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
  });

  return {
    data: {
      courseGroup,
      semester: { ...currentSemester, name: currentSemester.academicYear },
      students: students.map((s) => ({
        id: s.id,
        facultyNumber: s.facultyNumber,
        firstName: s.firstName,
        lastName: s.lastName,
        grade: s.grades[0] ?? null,
      })),
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
    select: { academicStaffId: true },
  });
  if (!courseGroup) {
    return { error: "CourseGroup not found", status: 404 };
  }
  if (courseGroup.academicStaffId !== academicStaffId) {
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
  const grades = await prisma.grade.findMany({
    where: { studentId },
    select: {
      id: true,
      finalGrade: true,
      courseGroup: {
        select: {
          id: true,
          semesterNum: true,
          semesterId: true,
          semester: { select: { id: true, academicYear: true, period: true } },
          course: {
            select: {
              id: true,
              code: true,
              name: true,
              credits: true,
            },
          },
          academicStaff: { select: { firstName: true, lastName: true, role: true } },
        },
      },
    },
    orderBy: [{ courseGroup: { semesterNum: "asc" } }],
  });

  const semesterMap = new Map<string, { semester: { id: number; name: string; period: string }; curriculumSemester: number; grades: unknown[] }>();

  for (const g of grades) {
    const cg = g.courseGroup;
    const key = `${cg.semester.id}-${cg.semesterNum}`;
    if (!semesterMap.has(key)) {
      semesterMap.set(key, {
        semester: { id: cg.semester.id, name: `${cg.semester.academicYear} ${cg.semester.period}`, period: cg.semester.period },
        curriculumSemester: cg.semesterNum,
        grades: [],
      });
    }
    semesterMap.get(key)!.grades.push({
      id: g.id,
      finalGrade: g.finalGrade,
      course: { ...cg.course, academicStaff: cg.academicStaff },
    });
  }

  const semesters = Array.from(semesterMap.values()).sort((a, b) => a.curriculumSemester - b.curriculumSemester);

  return { data: { semesters } };
}
