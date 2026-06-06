export interface Building {
  number: number;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}

export interface ScheduleEntry {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
  type: string;
  building: Building | null;
}

export interface CourseWithSchedule {
  id: number;
  code: string;
  name: string;
  description: string | null;
  credits: number;
  type: string;
  lecturer: { firstName: string; lastName: string; title: string };
  schedules: ScheduleEntry[];
}

export interface StudentProgram {
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
