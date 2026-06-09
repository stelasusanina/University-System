export interface GradeEntry {
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
}

export interface SemesterGrades {
  semester: { id: number; name: string; period: string };
  curriculumSemester: number;
  group: { number: number; year: number; specialty: { name: string } };
  grades: GradeEntry[];
}

export interface StudentGrades {
  semesters: SemesterGrades[];
}

export interface StudentRow {
  id: number;
  facultyNumber: string;
  firstName: string;
  lastName: string;
  grade: { id: number; finalGrade: number } | null;
}

export interface CourseGroupRow {
  id: number;
  curriculumSemester: number;
  group: { id: number; number: number; year: number; specialty: { name: string } };
  _count: { grades: number };
}

export interface CourseWithGroups {
  id: number;
  code: string;
  name: string;
  courseGroups: CourseGroupRow[];
}
