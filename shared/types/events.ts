export interface EventItem {
  id: number;
  title: string;
  type: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  room: string | null;
  course: { code: string; name: string };
  academicStaff?: { firstName: string; lastName: string; title: string };
  specialty?: { name: string };
  year?: number;
  group?: number | null;
}

export interface EventsResponse {
  dates: string[];
  events: EventItem[];
}
