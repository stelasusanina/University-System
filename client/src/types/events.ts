export type EventItem = {
  id: number;
  title: string;
  type: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  room: string | null;
  course: { code: string; name: string };
};

export type EventsResponse = {
  dates: string[];
  events: EventItem[];
};
