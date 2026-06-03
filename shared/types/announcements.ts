export interface Announcement {
  id: number;
  message: string;
  type: string;
  validTo: string;
  createdAt: string;
  course?: { code: string; name: string } | null;
  academicStaff?: { firstName: string; lastName: string; title: string };
  specialty?: { name: string };
  year?: number;
  group?: number | null;
}

export interface Course {
  id: number;
  code: string;
  name: string;
  specialtyId: number;
}

export interface Specialty {
  id: number;
  name: string;
  years: number;
}
