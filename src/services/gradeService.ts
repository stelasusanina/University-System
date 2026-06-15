import { prisma } from "../prisma.ts";

export async function getCoursesWithStudents(
  academicStaffId: number,
): Promise<{ error: string; status: number } | { data: unknown }> {
  const currentSemester = await prisma.semester.findFirst({
    where: { isCurrent: true },
    orderBy: [{ startDate: "desc" }],
    select: { id: true, academicYear: true, period: true },
  });
  if (!currentSemester) {
    return { error: "Няма активен семестър", status: 404 };
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

  return { data: { semester: { ...currentSemester, name: `${currentSemester.academicYear} ${currentSemester.period}` }, courses: Array.from(coursesMap.values()) } };
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
    return { error: "Учебната група не е намерена", status: 404 };
  }
  if (courseGroup.academicStaffId !== academicStaffId) {
    return { error: "Не сте преподавател на тази учебна група", status: 403 };
  }

  const currentSemester = await prisma.semester.findFirst({
    where: { isCurrent: true },
    orderBy: [{ startDate: "desc" }],
    select: { id: true, academicYear: true, period: true },
  });
  if (!currentSemester) {
    return { error: "Няма активен семестър", status: 404 };
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
      semester: { ...currentSemester, name: `${currentSemester.academicYear} ${currentSemester.period}` },
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
    return { error: "Учебната група не е намерена", status: 404 };
  }
  if (courseGroup.academicStaffId !== academicStaffId) {
    return { error: "Не сте преподавател на тази учебна група", status: 403 };
  }

  if (finalGrade !== null && (finalGrade < 2 || finalGrade > 6)) {
    return { error: "Оценката трябва да бъде между 2 и 6", status: 400 };
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
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { groupId: true },
  });

  if (!student) {
    return { error: "Student not found", status: 404 };
  }

  const courseGroups = await prisma.courseGroup.findMany({
    where: { groupId: student.groupId },
    select: {
      id: true,
      semesterNum: true,
      semesterId: true,
      semester: { select: { id: true, academicYear: true, period: true } },
      course: { select: { id: true, code: true, name: true, credits: true } },
      academicStaff: { select: { firstName: true, lastName: true, role: true } },
      grades: {
        where: { studentId },
        select: { id: true, finalGrade: true },
      },
    },
    orderBy: [{ semesterNum: "asc" }],
  });

  const semesterMap = new Map<string, { semester: { id: number; name: string; period: string }; curriculumSemester: number; grades: unknown[] }>();

  for (const cg of courseGroups) {
    const key = `${cg.semester.id}-${cg.semesterNum}`;
    if (!semesterMap.has(key)) {
      semesterMap.set(key, {
        semester: { id: cg.semester.id, name: `${cg.semester.academicYear} ${cg.semester.period}`, period: cg.semester.period },
        curriculumSemester: cg.semesterNum,
        grades: [],
      });
    }
    const grade = cg.grades[0] ?? null;
    semesterMap.get(key)!.grades.push({
      id: grade?.id ?? null,
      finalGrade: grade?.finalGrade ?? null,
      course: { id: cg.course.id, code: cg.course.code, name: cg.course.name, credits: cg.course.credits, academicStaff: cg.academicStaff },
    });
  }

  const semesters = Array.from(semesterMap.values()).sort((a, b) => a.curriculumSemester - b.curriculumSemester);

  return { data: { semesters } };
}
