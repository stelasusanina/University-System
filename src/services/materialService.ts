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
