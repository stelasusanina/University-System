export const ANNOUNCEMENT_TYPE_COLORS: Record<string, string> = {
  ИНФОРМАЦИЯ: "#3b82f6",
  ОТМЯНА: "#ef4444",
  ЗАКЪСНЕНИЕ: "#f59e0b",
  СМЯНА_НА_ЗАЛА: "#8b5cf6",
  СПЕШНО: "#dc2626",
};

export const ANNOUNCEMENT_CSS: Record<string, string> = {
  ИНФОРМАЦИЯ: "info",
  ОТМЯНА: "cancellation",
  ЗАКЪСНЕНИЕ: "delay",
  СМЯНА_НА_ЗАЛА: "room_change",
  СПЕШНО: "urgent",
};

export type Announcement = {
  id: number;
  message: string;
  type: string;
  validTo: string;
  createdAt: string;
  updatedAt: string;
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
