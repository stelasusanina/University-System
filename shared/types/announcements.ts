export type Announcement = {
  id: number;
  message: string;
  type: string;
  validTo: string;
  createdAt: string;
  courseGroup?: {
    course?: { code: string; name: string } | null;
    group?: { number: number; studyYear: number; specialty: { name: string } } | null;
  } | null;
  academicStaff?: { firstName: string; lastName: string; role: string };
};

export type Course = {
  id: number;
  code: string;
  name: string;
  specialtyId: number;
};

export type Specialty = {
  id: number;
  name: string;
  years: number;
};
