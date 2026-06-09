export type Announcement = {
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
