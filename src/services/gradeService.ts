import { prisma } from "../prisma.ts";

// Staff: list all enrollments for a course they teach (current semester)
export async function getEnrollmentsForCourse(
  courseId: number,
  academicStaffId: number,
): Promise<{ error: string; status: number } | { data: unknown }> {
  const course = await prisma.course.findFirst({
    where: { id: courseId, academicStaffId },
  });
  if (!course) return { error: "Course not found or not assigned to you", status: 403 };

  const currentSemester = await prisma.semester.findFirst({
    where: { isCurrent: true },
    orderBy: [{ year: "desc" }, { startDate: "desc" }],
    select: { id: true, name: true },
  });
  if (!currentSemester) return { error: "No active semester found", status: 404 };

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId, semesterId: currentSemester.id },
    orderBy: [{ student: { lastName: "asc" } }, { student: { firstName: "asc" } }],
    select: {
      id: true,
      grade: true,
      status: true,
      student: {
        select: {
          id: true,
          facultyNumber: true,
          firstName: true,
          lastName: true,
          year: true,
          group: true,
        },
      },
    },
  });

  return {
    data: {
      course: { id: course.id, code: course.code, name: course.name },
      semester: currentSemester,
      enrollments,
    },
  };
}

// Staff: list all courses they teach (current semester) with enrollment counts
export async function getCoursesWithEnrollments(
  academicStaffId: number,
): Promise<{ error: string; status: number } | { data: unknown }> {
  const currentSemester = await prisma.semester.findFirst({
    where: { isCurrent: true },
    orderBy: [{ year: "desc" }, { startDate: "desc" }],
    select: { id: true, name: true },
  });
  if (!currentSemester) return { error: "No active semester found", status: 404 };

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
      year: true,
      semester: true,
      _count: { select: { enrollments: true } },
    },
  });

  return { data: { semester: currentSemester, courses } };
}

// Staff: set or update a grade on an enrollment they own
export async function setGrade(
  enrollmentId: number,
  academicStaffId: number,
  grade: number | null,
  status: string | undefined,
): Promise<{ error: string; status: number } | { data: unknown }> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: { id: true, course: { select: { academicStaffId: true } } },
  });
  if (!enrollment) return { error: "Enrollment not found", status: 404 };
  if (enrollment.course.academicStaffId !== academicStaffId)
    return { error: "You are not the lecturer for this course", status: 403 };

  if (grade !== null && (grade < 2 || grade > 6)) {
    return { error: "Grade must be between 2 and 6", status: 400 };
  }

  const updated = await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      grade: grade ?? null,
      ...(status ? { status: status as "ENROLLED" | "PASSED" | "FAILED" | "WITHDRAWN" } : {}),
    },
    select: {
      id: true,
      grade: true,
      status: true,
      student: { select: { firstName: true, lastName: true, facultyNumber: true } },
    },
  });

  return { data: updated };
}

// Student: get all their grades across all semesters
export async function getMyGrades(
  studentId: number,
): Promise<{ error: string; status: number } | { data: unknown }> {
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId },
    orderBy: [{ semester: { year: "desc" } }, { semester: { period: "asc" } }, { course: { name: "asc" } }],
    select: {
      id: true,
      grade: true,
      status: true,
      course: {
        select: {
          id: true,
          code: true,
          name: true,
          credits: true,
          year: true,
          semester: true,
          academicStaff: { select: { firstName: true, lastName: true, title: true } },
        },
      },
      semester: { select: { id: true, name: true, year: true, period: true } },
    },
  });

  // Group by semester
  const bySemester = new Map<number, { semester: unknown; enrollments: unknown[] }>();
  for (const e of enrollments) {
    const sid = e.semester.id;
    if (!bySemester.has(sid)) {
      bySemester.set(sid, { semester: e.semester, enrollments: [] });
    }
    bySemester.get(sid)!.enrollments.push(e);
  }

  return { data: { semesters: Array.from(bySemester.values()) } };
}
