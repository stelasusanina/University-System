export type Material = {
  id: number;
  title: string;
  description: string | null;
  fileUrl: string;
  fileType: string;
  uploadedAt: string;
};

export type CourseWithMaterials = {
  id: number;
  code: string;
  name: string;
  year: number;
  semester: number;
  materials: Material[];
};

export type StudentMaterials = {
  courses: CourseWithMaterials[];
};
