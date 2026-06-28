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
  const courseGroup = await prisma.courseGroup.findFirst({
    where: { courseId: input.courseId, academicStaffId: input.academicStaffId },
  });
  if (!courseGroup) {
    throw new Error("Курсът не е намерен или не сте лектор на този курс");
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
  const courseGroups = await prisma.courseGroup.findMany({
    where: { academicStaffId },
    select: {
      course: { select: { id: true, code: true, name: true } },
    },
    distinct: ["courseId"],
    orderBy: [{ course: { name: "asc" } }],
  });
  return courseGroups.map((cg) => cg.course);
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
    return { error: "Материалът не е намерен", status: 404 };
  }
  if (material.academicStaffId !== academicStaffId) {
    return { error: "Можете да изтривате само собствените си материали", status: 403 };
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
        select: { firstName: true, lastName: true, role: true },
      },
    },
  });
}

export async function getCoursesWithMaterialsForStudent(studentId: number) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { groupId: true, group: { select: { studyYear: true } } },
  });
  if (!student) {
    return null;
  }

  const courseGroups = await prisma.courseGroup.findMany({
    where: { groupId: student.groupId },
    orderBy: [{ semesterNum: "desc" }, { course: { name: "asc" } }],
    select: {
      semesterNum: true,
      course: {
        select: {
          id: true,
          code: true,
          name: true,
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
    distinct: ["courseId"],
  });

  const courses = courseGroups.map(({ semesterNum, course }) => ({
    ...course,
    year: Math.ceil(semesterNum / 2),
    semester: semesterNum,
  }));

  return { courses };
}
