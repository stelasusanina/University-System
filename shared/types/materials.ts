export interface Material {
  id: number;
  title: string;
  description: string | null;
  fileUrl: string;
  fileType: string;
  uploadedAt: string;
}

export interface CourseWithMaterials {
  id: number;
  code: string;
  name: string;
  year: number;
  semester: number;
  type: string;
  academicStaff: { firstName: string; lastName: string; title: string };
  materials: Material[];
}

export interface StudentMaterials {
  courses: CourseWithMaterials[];
}
