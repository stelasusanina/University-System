export type GradeEntry = {
  id: number;
  finalGrade: number;
  course: {
    id: number;
    code: string;
    name: string;
    credits: number;
    academicStaff: { firstName: string; lastName: string; role: string };
  };
};

export type SemesterGrades = {
  semester: { id: number; name: string; period: string };
  curriculumSemester: number;
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
  semesterNum: number;
  group: { id: number; number: number; studyYear: number; specialty: { name: string } };
  _count: { grades: number };
};

export type CourseWithGroups = {
  id: number;
  code: string;
  name: string;
  courseGroups: CourseGroupRow[];
};
