import { prisma } from "../prisma.ts";
import path from "path";

type UploadMaterialInput = {
  title: string;
  description?: string | undefined;
  fileUrl: string;
  originalName: string;
  courseId: number;
  academicStaffId: number;
};

function extractFileType(originalName: string): string {
  return path.extname(originalName).replace(".", "").toLowerCase();
}

export async function uploadMaterial(input: UploadMaterialInput) {
  const course = await prisma.course.findFirst({
    where: { id: input.courseId, academicStaffId: input.academicStaffId },
  });
  if (!course) {
    throw new Error("Course not found or you are not the assigned lecturer for this course");
  }

  const fileType = extractFileType(input.originalName);

  return prisma.material.create({
    data: {
      title: input.title,
      description: input.description ?? null,
      fileUrl: input.fileUrl,
      fileType,
      courseId: input.courseId,
      academicStaffId: input.academicStaffId,
    },
  });
}

export async function getCoursesForStaff(academicStaffId: number) {
  return prisma.course.findMany({
    where: { academicStaffId },
    orderBy: [{ name: "asc" }],
    select: { id: true, code: true, name: true },
  });
}

export async function getMaterialsByStaff(academicStaffId: number) {
  return prisma.material.findMany({
    where: { academicStaffId },
    orderBy: { uploadedAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      fileUrl: true,
      fileType: true,
      uploadedAt: true,
      course: { select: { id: true, code: true, name: true } },
    },
  });
}

export async function deleteMaterial(
  materialId: number,
  academicStaffId: number,
): Promise<{ error: string; status: number } | { success: true }> {
  const material = await prisma.material.findUnique({ where: { id: materialId } });
  if (!material) {
    return { error: "Material not found", status: 404 };
  }
  if (material.academicStaffId !== academicStaffId) {
    return { error: "You can only delete your own materials", status: 403 };
  }

  await prisma.material.delete({ where: { id: materialId } });
  return { success: true };
}

export async function getMaterialsForCourse(courseId: number) {
  return prisma.material.findMany({
    where: { courseId },
    orderBy: { uploadedAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      fileUrl: true,
      fileType: true,
      uploadedAt: true,
      academicStaff: {
        select: { firstName: true, lastName: true, title: true },
      },
    },
  });
}

export async function getCoursesWithMaterialsForStudent(studentId: number) {
  const currentSemester = await prisma.semester.findFirst({
    where: { isCurrent: true },
    orderBy: [{ startDate: "desc" }],
    select: { id: true },
  });

  if (!currentSemester) return null;

  const studentSemester = await prisma.studentSemester.findUnique({
    where: { studentId_semesterId: { studentId, semesterId: currentSemester.id } },
    select: { groupId: true, curriculumSemester: true },
  });

  if (!studentSemester) return null;

  const courseGroups = await prisma.courseGroup.findMany({
    where: {
      groupId: studentSemester.groupId,
      curriculumSemester: studentSemester.curriculumSemester,
    },
    orderBy: [{ course: { name: "asc" } }],
    select: {
      curriculumSemester: true,
      course: {
        select: {
          id: true,
          code: true,
          name: true,
          type: true,
          academicStaff: { select: { firstName: true, lastName: true, title: true } },
          materials: {
            orderBy: { uploadedAt: "desc" },
            select: {
              id: true,
              title: true,
              description: true,
              fileUrl: true,
              fileType: true,
              uploadedAt: true,
            },
          },
        },
      },
    },
  });

  const courses = courseGroups.map(({ curriculumSemester, course }) => ({
    ...course,
    semester: curriculumSemester,
  }));

  return { courses };
}
