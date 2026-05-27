import { useEffect, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { PickerDay, type PickerDayProps } from "@mui/x-date-pickers/PickerDay";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import type { EventItem, EventsResponse } from "../types/events";
import Navbar from "../components/Navbar";

interface Announcement {
  id: number;
  message: string;
  type: string;
  validTo: string;
  createdAt: string;
  course?: { code: string; name: string } | null;
  academicStaff?: { firstName: string; lastName: string; title: string };
  specialty?: { name: string };
}

interface Course {
  id: number;
  code: string;
  name: string;
  specialtyId: number;
}

interface Specialty {
  id: number;
  name: string;
  years: number;
}

const EVENT_TYPES = ["КОНТРОЛНА", "ИЗПИТ", "ЗАДАНИЕ", "ЗАЩИТА_НА_ПРОЕКТ", "ДРУГО"];

const ANNOUNCEMENT_CSS: Record<string, string> = {
  "ИНФОРМАЦИЯ": "info",
  "ОТМЯНА": "cancellation",
  "ЗАКЪСНЕНИЕ": "delay",
  "СМЯНА_НА_ЗАЛА": "room_change",
  "СПЕШНО": "urgent",
};
const STAFF_ROLES = ["PROFESSOR", "ASSOCIATE_PROFESSOR", "SENIOR_ASSISTANT", "ASSISTANT"];

export default function HomePage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [highlightedDates, setHighlightedDates] = useState<Set<string>>(new Set());
  const [events, setEvents] = useState<EventItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const isStaff = user?.role && STAFF_ROLES.includes(user.role);

  const [showAddModal, setShowAddModal] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState("КОНТРОЛНА");
  const [formDate, setFormDate] = useState(selectedDate?.format("YYYY-MM-DD") ?? "");
  const [formStartTime, setFormStartTime] = useState("");
  const [formEndTime, setFormEndTime] = useState("");
  const [formRoom, setFormRoom] = useState("");
  const [formCourseId, setFormCourseId] = useState<number | "">("");
  const [formSpecialtyId, setFormSpecialtyId] = useState<number | "">("");
  const [formYear, setFormYear] = useState<number | "">("");
  const [formGroup, setFormGroup] = useState<number | "">("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function loadEvents() {
    api.get<EventsResponse>("/events/dates").then((res) => {
      setHighlightedDates(new Set(res.dates));
      setEvents(res.events);
    }).catch(() => {});
  }

  useEffect(() => {
    loadEvents();
    api.get<Announcement[]>("/announcements").then(setAnnouncements).catch(() => {});
  }, []);

  useEffect(() => {
    if (isStaff) {
      api.get<{ courses: Course[]; specialties: Specialty[] }>("/events/form-options")
        .then((res) => {
          setCourses(res.courses);
          setSpecialties(res.specialties);
        })
        .catch(() => {});
    }
  }, [isStaff]);

  function openAddModal() {
    setFormTitle("");
    setFormType("КОНТРОЛНА");
    setFormDate(selectedDate?.format("YYYY-MM-DD") ?? "");
    setFormStartTime("");
    setFormEndTime("");
    setFormRoom("");
    setFormCourseId("");
    setFormSpecialtyId("");
    setFormYear("");
    setFormGroup("");
    setFormError("");
    setShowAddModal(true);
  }

  function handleCourseChange(courseId: number | "") {
    setFormCourseId(courseId);
    if (courseId !== "") {
      const course = courses.find((c) => c.id === courseId);
      if (course) setFormSpecialtyId(course.specialtyId);
    } else {
      setFormSpecialtyId("");
    }
  }

  async function handleAddEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!formTitle || !formType || !formDate || formCourseId === "" || formSpecialtyId === "" || formYear === "") {
      setFormError("Заглавие, вид, дата, дисциплина, специалност и курс са задължителни.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      await api.post("/events", {
        title: formTitle,
        type: formType,
        date: formDate,
        startTime: formStartTime || undefined,
        endTime: formEndTime || undefined,
        room: formRoom || undefined,
        courseId: formCourseId,
        specialtyId: formSpecialtyId,
        year: formYear,
        group: formGroup !== "" ? formGroup : undefined,
      });
      setShowAddModal(false);
      loadEvents();
    } catch (err: any) {
      setFormError(err.message || "Неуспешно създаване на събитие");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteEvent(eventId: number) {
    try {
      await api.delete(`/events/${eventId}`);
      loadEvents();
    } catch {}
  }

  const selectedDateStr = selectedDate?.format("YYYY-MM-DD") ?? "";
  const selectedEvents = events.filter((e) => e.date.split("T")[0] === selectedDateStr);

  const selectedSpecialty = specialties.find((s) => s.id === formSpecialtyId);

  function ScheduleDay(props: PickerDayProps) {
    const { day, outsideCurrentMonth, today, ...other } = props;
    const dateStr = dayjs(day).format("YYYY-MM-DD");
    const hasEvent = !outsideCurrentMonth && highlightedDates.has(dateStr);

    return (
      <PickerDay
        {...other}
        day={day}
        outsideCurrentMonth={outsideCurrentMonth}
        today={today}
        sx={
          today && !outsideCurrentMonth
            ? {
                backgroundColor: "#1976d2 !important",
                color: "#fff !important",
                fontWeight: 700,
                "&:hover": {
                  backgroundColor: "#1565c0 !important",
                },
                ...(hasEvent && {
                  border: "2px solid #1e3a8a",
                }),
              }
            : hasEvent
              ? {
                  border: "2px solid #1e3a8a",
                  borderRadius: "50%",
                  fontWeight: 700,
                  "&.Mui-selected": {
                    backgroundColor: "#1e3a8a",
                    color: "#fff",
                    border: "2px solid #1e3a8a",
                  },
                  "&.Mui-selected:hover": {
                    backgroundColor: "#1e3a8a",
                  },
                }
              : {
                  "&.Mui-selected": {
                    backgroundColor: "transparent",
                    color: "inherit",
                  },
                  "&.Mui-selected:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                  },
                }
        }
      />
    );
  }

  return (
    <div className="app-layout">
      <Navbar />

      <main className="home-main">
        <h1 className="home-welcome">Добре дошли, {user?.firstName} {user?.lastName}</h1>
        <div className="home-grid">
          <section className="calendar-card home-calendar-card">
            <div className="calendar-card-header">
              {isStaff && (
                <button type="button" className="add-event-btn" onClick={openAddModal} title="Добави събитие">
                  + Добави събитие
                </button>
              )}
            </div>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateCalendar
                value={selectedDate}
                onChange={(nextDate) => setSelectedDate(nextDate)}
                slots={{ day: ScheduleDay }}
              />
            </LocalizationProvider>
            <div className="calendar-events-box">
              <h3>{selectedDate?.format("dddd, D MMMM YYYY")}</h3>
              {selectedEvents.length > 0 ? (
                selectedEvents.map((event) => (
                  <div key={event.id} className="calendar-event-item">
                    <span className="calendar-event-type">{event.type}</span>
                    <strong>{event.course.name}</strong>
                    <span>{event.title}</span>
                    {event.startTime && <span>{event.startTime}{event.endTime ? `–${event.endTime}` : ""}</span>}
                    {event.room && <span>Зала {event.room}</span>}
                    {isStaff && event.specialty && (
                      <span className="calendar-event-meta">
                        {event.specialty.name} · Курс {event.year}{event.group != null ? ` · Група ${event.group}` : ""}
                      </span>
                    )}
                    {isStaff && (
                      <button
                        type="button"
                        className="event-delete-btn"
                        onClick={() => handleDeleteEvent(event.id)}
                        title="Премахни събитие"
                      >
                        Премахни
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="calendar-no-events">Няма планирани събития</p>
              )}
            </div>
          </section>

          <section className="announcements-card">
            <h2>{user?.role === "STUDENT" ? "Съобщения" : "Мои съобщения"}</h2>
            {announcements.length > 0 ? (
              announcements.map((a) => (
                <div key={a.id} className={`announcement-item announcement-${ANNOUNCEMENT_CSS[a.type] ?? a.type.toLowerCase()}`}>
                  <div className="announcement-header">
                    <span className={`announcement-badge announcement-badge-${ANNOUNCEMENT_CSS[a.type] ?? a.type.toLowerCase()}`}>{a.type.replace("_", " ")}</span>
                    <span className="announcement-time">{dayjs(a.createdAt).format("D MMM, HH:mm")}</span>
                  </div>
                  <p className="announcement-message">{a.message}</p>
                  {a.academicStaff && (
                    <span className="announcement-author">
                      — {a.academicStaff.title} {a.academicStaff.firstName} {a.academicStaff.lastName}
                    </span>
                  )}
                  {a.course && <span className="announcement-course">{a.course.name}</span>}
                </div>
              ))
            ) : (
              <p className="calendar-no-events">Няма съобщения</p>
            )}
          </section>
        </div>
      </main>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2>Добави събитие</h2>
            <form onSubmit={handleAddEvent} className="event-form">
              <div className="form-group">
                <label>Заглавие</label>
                <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Вид</label>
                  <select value={formType} onChange={(e) => setFormType(e.target.value)}>
                    {EVENT_TYPES.map((t) => (
                      <option key={t} value={t}>{t.replace("_", " ")}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Дата</label>
                  <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Начален час</label>
                  <input type="time" value={formStartTime} onChange={(e) => setFormStartTime(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Краен час</label>
                  <input type="time" value={formEndTime} onChange={(e) => setFormEndTime(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Зала</label>
                  <input value={formRoom} onChange={(e) => setFormRoom(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label>Дисциплина</label>
                <select value={formCourseId} onChange={(e) => handleCourseChange(e.target.value ? Number(e.target.value) : "")} required>
                  <option value="">— изберете дисциплина —</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Специалност</label>
                  <select value={formSpecialtyId} onChange={(e) => setFormSpecialtyId(e.target.value ? Number(e.target.value) : "")} required>
                    <option value="">— изберете специалност —</option>
                    {specialties.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Курс</label>
                  <select value={formYear} onChange={(e) => setFormYear(e.target.value ? Number(e.target.value) : "")} required>
                    <option value="">—</option>
                    {selectedSpecialty
                      ? Array.from({ length: selectedSpecialty.years }, (_, i) => i + 1).map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))
                      : Array.from({ length: 5 }, (_, i) => i + 1).map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Група (по избор)</label>
                  <input
                    type="number"
                    min={1}
                    value={formGroup}
                    onChange={(e) => setFormGroup(e.target.value ? Number(e.target.value) : "")}
                  />
                </div>
              </div>
              {formError && <p className="form-error">{formError}</p>}
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Отказ</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? "Запазване..." : "Добави"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
