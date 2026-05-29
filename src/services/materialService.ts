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
  // Ownership guard: staff can only upload to courses they teach
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

// Staff: list all courses they are assigned to (all semesters) for the upload dropdown
export async function getCoursesForStaff(academicStaffId: number) {
  return prisma.course.findMany({
    where: { academicStaffId },
    orderBy: [{ year: "asc" }, { semester: "asc" }, { name: "asc" }],
    select: { id: true, code: true, name: true, year: true, semester: true },
  });
}

// Staff: list all materials they have uploaded across all courses
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

// Staff: delete own material (ownership enforced)
export async function deleteMaterial(
  materialId: number,
  academicStaffId: number,
): Promise<{ error: string; status: number } | { success: true }> {
  const material = await prisma.material.findUnique({ where: { id: materialId } });
  if (!material) return { error: "Material not found", status: 404 };
  if (material.academicStaffId !== academicStaffId)
    return { error: "You can only delete your own materials", status: 403 };

  await prisma.material.delete({ where: { id: materialId } });
  return { success: true };
}

// Shared: list materials for a single course
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

// Student: list all courses with materials for the student's specialty (all semesters/years)
export async function getCoursesWithMaterialsForStudent(studentId: number) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { specialtyId: true },
  });

  if (!student) return null;

  const courses = await prisma.course.findMany({
    where: { specialtyId: student.specialtyId },
    orderBy: [{ year: "asc" }, { semester: "asc" }, { name: "asc" }],
    select: {
      id: true,
      code: true,
      name: true,
      year: true,
      semester: true,
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
  });

  return { courses };
}
