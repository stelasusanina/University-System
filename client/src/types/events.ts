export type EventItem = {
  id: number;
  title: string;
  type: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  room: string | null;
  course: { code: string; name: string };
  // present for academic staff view
  academicStaff?: { firstName: string; lastName: string; title: string };
  specialty?: { name: string };
  year?: number;
  group?: number | null;
};

export type EventsResponse = {
  dates: string[];
  events: EventItem[];
};
