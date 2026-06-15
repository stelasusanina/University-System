export const LESSON_TYPE_LABELS: Record<string, string> = {
  ЛЕКЦИЯ: "Лекция",
  СЕМИНАРНО_УПРАЖНЕНИЕ: "Семинарно упражнение",
  ЛАБОРАТОРНО_УПРАЖНЕНИЕ: "Лабораторно упражнение",
};

export type Building = {
  number: number;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  googleMapsUrl: string | null;
}

export type ScheduleEntry = {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
  type: string;
  building: Building | null;
}

export type CourseWithSchedule = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  credits: number;
  lecturer: { firstName: string; lastName: string; role: string };
  schedules: ScheduleEntry[];
}

export type StudentProgram = {
  student: {
    id: number;
    facultyNumber: string;
    firstName: string;
    lastName: string;
    year: number;
    group: number | null;
    specialty: string;
    faculty: string;
  };
  semester: { id: number; name: string; period: string };
  courses: CourseWithSchedule[];
}

export type StudentProgramResponse = {
  student: {
    id: number;
    facultyNumber: string;
    firstName: string;
    lastName: string;
    year: number;
    group: number;
    specialty: string;
    faculty: string;
  };
  semester: {
    id: number;
    name: string;
    year: number;
    period: string;
  };
  courses: Array<{
    id: number;
    code: string;
    name: string;
    description: string | null;
    credits: number;
    status: string;
    lecturer: {
      firstName: string;
      lastName: string;
      role: string;
    };
    schedules: Array<{
      id: number;
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      room: string;
      type: string;
      building: Building | null;
    }>;
  }>;
};

export type StaffProgramResponse = {
  staff: {
    id: number;
    staffNumber: string;
    firstName: string;
    lastName: string;
    role: string;
    faculty: string;
  };
  semester: {
    id: number;
    name: string;
    period: string;
  };
  courses: Array<{
    id: number;
    code: string;
    name: string;
    description: string | null;
    credits: number;
    specialty: string;
    group: number;
    year: number;
    semesterNum: number;
    schedules: Array<{
      id: number;
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      room: string;
      type: string;
    }>;
  }>;
};

export type ProgramResponse = StudentProgramResponse | StaffProgramResponse;

export type TimetableEntry = {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
  type: string;
  courseCode: string;
  courseName: string;
  building: Building | null;
};
