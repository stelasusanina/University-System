export type GradeEntry = {
  id: number;
  finalGrade: number;
  course: {
    id: number;
    code: string;
    name: string;
    credits: number;
    type: string;
    academicStaff: { firstName: string; lastName: string; title: string };
  };
};

export type SemesterGrades = {
  semester: { id: number; name: string; period: string };
  curriculumSemester: number;
  group: { number: number; year: number; specialty: { name: string } };
  grades: GradeEntry[];
};

export type StudentGrades = {
  semesters: SemesterGrades[];
};

export type StudentRow = {
  id: number;
  facultyNumber: string;
  firstName: string;
  lastName: string;
  grade: { id: number; finalGrade: number } | null;
};

export type CourseGroupRow = {
  id: number;
  curriculumSemester: number;
  group: { id: number; number: number; year: number; specialty: { name: string } };
  _count: { grades: number };
};

export type CourseWithGroups = {
  id: number;
  code: string;
  name: string;
  courseGroups: CourseGroupRow[];
};
