export interface CourseRow {
  id: number;
  code: string;
  name: string;
  year: number;
  semester: number;
  _count: { enrollments: number };
}

export interface EnrollmentRow {
  id: number;
  grade: number | null;
  status: string;
  student: {
    id: number;
    facultyNumber: string;
    firstName: string;
    lastName: string;
    year: number;
    group: number;
  };
}

export interface SemesterGrades {
  semester: { id: number; name: string; year: number; period: string };
  enrollments: {
    id: number;
    grade: number | null;
    status: string;
    course: {
      id: number;
      code: string;
      name: string;
      credits: number;
      year: number;
      semester: number;
      academicStaff: { firstName: string; lastName: string; title: string };
    };
  }[];
}
