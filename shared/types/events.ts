export const EVENT_TYPE_LABELS: Record<string, string> = {
  КОНТРОЛНА: "Контролна",
  ИЗПИТ: "Изпит",
  ЗАДАНИЕ: "Задание",
  ЗАЩИТА_НА_ПРОЕКТ: "Защита на проект",
  ДРУГО: "Друго",
};

export type EventItem = {
  id: number;
  title: string;
  type: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  room: string | null;
  course: { code: string; name: string };
  group?: { number: number; studyYear: number } | null;
  academicStaff?: { firstName: string; lastName: string; role: string };
};

export type EventsResponse = {
  dates: string[];
  events: EventItem[];
};
