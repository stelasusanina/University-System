import type { BuildingInfo } from "./building";

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
    type: string;
    status: string;
    lecturer: {
      firstName: string;
      lastName: string;
      title: string;
    };
    schedules: Array<{
      id: number;
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      room: string;
      type: string;
      building: BuildingInfo | null;
    }>;
  }>;
};

export type StaffProgramResponse = {
  staff: {
    id: number;
    staffNumber: string;
    firstName: string;
    lastName: string;
    title: string;
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
    type: string;
    specialty: string;
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
  lecturerName: string | null;
  building: BuildingInfo | null;
};
