import { useEffect, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { PickerDay, type PickerDayProps } from "@mui/x-date-pickers/PickerDay";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import type { EventItem, EventsResponse } from "@shared/types/events";
import { EVENT_TYPE_LABELS } from "@shared/types/events";
import type { Announcement } from "@shared/types/announcements";
import { ANNOUNCEMENT_CSS } from "@shared/types/announcements";
import { ROLE_LABELS } from "@shared/types/auth";
import Navbar from "../components/Navbar";

const EVENT_TYPES = Object.keys(EVENT_TYPE_LABELS);

const STAFF_ROLES = ["ПРОФЕСОР", "ДОЦЕНТ", "ГЛАВЕН_АСИСТЕНТ", "АСИСТЕНТ"];

type CourseGroupOption = {
  id: number;
  semesterNum: number;
  course: { id: number; code: string; name: string };
  group: {
    id: number;
    number: number;
    studyYear: number;
    specialty: { id: number; name: string };
  };
};

export default function HomePage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [highlightedDates, setHighlightedDates] = useState<Set<string>>(
    new Set(),
  );
  const [events, setEvents] = useState<EventItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const isStaff = user?.role && STAFF_ROLES.includes(user.role);

  const [showAddModal, setShowAddModal] = useState(false);
  const [courseGroups, setCourseGroups] = useState<CourseGroupOption[]>([]);
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState("КОНТРОЛНА");
  const [formDate, setFormDate] = useState(
    selectedDate?.format("YYYY-MM-DD") ?? "",
  );
  const [formStartTime, setFormStartTime] = useState("");
  const [formEndTime, setFormEndTime] = useState("");
  const [formRoom, setFormRoom] = useState("");
  const [formCourseGroupId, setFormCourseGroupId] = useState<number | "">("");
  const [formSelectedGroupKey, setFormSelectedGroupKey] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function loadEvents() {
    api
      .get<EventsResponse>("/events/dates")
      .then((res) => {
        setHighlightedDates(new Set(res.dates));
        setEvents(res.events);
      })
      .catch(() => {});
  }

  useEffect(() => {
    loadEvents();
    api
      .get<Announcement[]>("/announcements")
      .then(setAnnouncements)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isStaff) {
      api
        .get<{ courseGroups: CourseGroupOption[] }>("/events/form-options")
        .then((res) => setCourseGroups(res.courseGroups))
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
    setFormCourseGroupId("");
    setFormSelectedGroupKey("");
    setFormError("");
    setShowAddModal(true);
  }

  function handleCourseChange(courseGroupId: number | "") {
    setFormCourseGroupId(courseGroupId);
  }

  async function handleAddEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!formTitle || !formType || !formDate || formCourseGroupId === "") {
      setFormError("Заглавие, вид, дата и група са задължителни.");
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
        courseGroupId: formCourseGroupId,
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
  const selectedEvents = events.filter(
    (e) => e.date.split("T")[0] === selectedDateStr,
  );

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
        <h1 className="home-welcome">
          Добре дошли, {user?.firstName} {user?.lastName}
        </h1>
        <div className="home-grid">
          <section className="calendar-card home-calendar-card">
            <div className="calendar-card-header">
              {isStaff && (
                <button
                  type="button"
                  className="add-event-btn"
                  onClick={openAddModal}
                  title="Добави събитие"
                >
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
              <h3>{selectedDate ? new Date(selectedDate.toDate()).toLocaleDateString("bg-BG", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : ""}</h3>
              {selectedEvents.length > 0 ? (
                selectedEvents.map((event) => (
                  <div key={event.id} className="calendar-event-item">
                    <span className="calendar-event-type">{EVENT_TYPE_LABELS[event.type] ?? event.type}</span>
                    <strong>{event.course.name}</strong>
                    <span>{event.title}</span>
                    {event.startTime && (
                      <span>
                        {event.startTime}
                        {event.endTime ? ` - ${event.endTime}` : ""}
                      </span>
                    )}
                    {event.room && <span>Зала {event.room}</span>}
                    {isStaff && event.group && (
                      <span className="calendar-event-meta">
                        Курс {event.group.studyYear} · Група{" "}
                        {event.group.number}
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
            <h2>{user?.role === "СТУДЕНТ" ? "Съобщения" : "Мои съобщения"}</h2>
            {announcements.length > 0 ? (
              announcements.map((a) => (
                <div
                  key={a.id}
                  className={`announcement-item announcement-${ANNOUNCEMENT_CSS[a.type] ?? a.type.toLowerCase()}`}
                >
                  <div className="announcement-header">
                    <span
                      className={`announcement-badge announcement-badge-${ANNOUNCEMENT_CSS[a.type] ?? a.type.toLowerCase()}`}
                    >
                      {a.type.replaceAll("_", " ")}
                    </span>
                    <div className="announcement-time">
                      <span>Публикувано на: {new Date(a.updatedAt ?? a.createdAt).toLocaleString("bg-BG", {
                        timeZone: "UTC",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}</span>
                      <span>Валидно до: {new Date(a.validTo).toLocaleString("bg-BG", {
                        timeZone: "UTC",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}</span>
                    </div>
                  </div>
                  <p className="announcement-message">{a.message}</p>
                  {a.academicStaff && (
                    <span className="announcement-author">
                      - {ROLE_LABELS[a.academicStaff.role] ?? a.academicStaff.role} {a.academicStaff.firstName}{" "}
                      {a.academicStaff.lastName}
                    </span>
                  )}
                  {a.courseGroup?.course && (
                    <span className="announcement-course">
                      {a.courseGroup.course.name}
                    </span>
                  )}
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
                <input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Вид</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                  >
                    {EVENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {EVENT_TYPE_LABELS[t] ?? t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Дата</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Начален час</label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Краен час</label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Зала</label>
                  <input
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Група *</label>
                  <select
                    value={formSelectedGroupKey}
                    onChange={(e) => {
                      setFormSelectedGroupKey(e.target.value);
                      setFormCourseGroupId("");
                    }}
                    required
                  >
                    <option value="">— изберете група —</option>
                    {[...new Map(courseGroups.map((cg) => {
                      const key = `${cg.group.studyYear}-${cg.group.number}`;
                      return [key, cg];
                    })).values()].map((cg) => {
                      const key = `${cg.group.studyYear}-${cg.group.number}`;
                      return (
                        <option key={key} value={key}>
                          Курс {cg.group.studyYear}, Група {cg.group.number}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="form-group">
                  <label>Предмет *</label>
                  <select
                    value={formCourseGroupId}
                    onChange={(e) => setFormCourseGroupId(e.target.value ? Number(e.target.value) : "")}
                    disabled={!formSelectedGroupKey}
                    required
                  >
                    <option value="">— изберете предмет —</option>
                    {courseGroups
                      .filter((cg) => `${cg.group.studyYear}-${cg.group.number}` === formSelectedGroupKey)
                      .map((cg) => (
                        <option key={cg.id} value={cg.id}>
                          {cg.course.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              {formError && <p className="form-error">{formError}</p>}
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Отказ
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
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
