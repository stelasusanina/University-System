import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { PickerDay, type PickerDayProps } from "@mui/x-date-pickers/PickerDay";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import type { EventItem, EventsResponse } from "../types/events";

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

const EVENT_TYPES = ["TEST", "EXAM", "ASSIGNMENT", "PROJECT_DEFENSE", "OTHER"];
const STAFF_ROLES = ["PROFESSOR", "ASSOCIATE_PROFESSOR", "SENIOR_ASSISTANT", "ASSISTANT"];

export default function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [highlightedDates, setHighlightedDates] = useState<Set<string>>(new Set());
  const [events, setEvents] = useState<EventItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const isStaff = user?.role && STAFF_ROLES.includes(user.role);

  // Add event modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState("TEST");
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

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  function openAddModal() {
    setFormTitle("");
    setFormType("TEST");
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
      setFormError("Title, type, date, course, specialty and year are required.");
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
      setFormError(err.message || "Failed to create event");
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
      <nav className="top-nav">
        <div className="top-nav-brand">University System</div>
        <div className="top-nav-links">
          <Link to="/home" className="nav-link nav-link-active">Home</Link>
          <Link to="/schedule" className="nav-link">Schedule</Link>
          {user?.role !== "STUDENT" && <Link to="/announcements" className="nav-link">Announcements</Link>}
          <Link to="/materials" className="nav-link">Materials</Link>
          <Link to="/grades" className="nav-link">Grades</Link>
        </div>
        <div className="top-nav-user">
          <span>{user?.email}</span>
          <button type="button" onClick={handleLogout} className="nav-logout-button">
            Logout
          </button>
        </div>
      </nav>

      <main className="home-main">
        <h1>Welcome, {user?.email}</h1>
        <div className="home-grid">
          <section className="calendar-card home-calendar-card">
            <div className="calendar-card-header">
              {isStaff && (
                <button type="button" className="add-event-btn" onClick={openAddModal} title="Add event">
                  + Add Event
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
                    {event.room && <span>Room {event.room}</span>}
                    {isStaff && event.specialty && (
                      <span className="calendar-event-meta">
                        {event.specialty.name} · Year {event.year}{event.group != null ? ` · Group ${event.group}` : ""}
                      </span>
                    )}
                    {isStaff && (
                      <button
                        type="button"
                        className="event-delete-btn"
                        onClick={() => handleDeleteEvent(event.id)}
                        title="Remove event"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="calendar-no-events">Nothing planned</p>
              )}
            </div>
          </section>

          <section className="announcements-card">
            <h2>{user?.role === "STUDENT" ? "Announcements" : "Announcements by me"}</h2>
            {announcements.length > 0 ? (
              announcements.map((a) => (
                <div key={a.id} className={`announcement-item announcement-${a.type.toLowerCase()}`}>
                  <div className="announcement-header">
                    <span className={`announcement-badge announcement-badge-${a.type.toLowerCase()}`}>{a.type.replace("_", " ")}</span>
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
              <p className="calendar-no-events">No announcements</p>
            )}
          </section>
        </div>
      </main>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2>Add Event</h2>
            <form onSubmit={handleAddEvent} className="event-form">
              <div className="form-group">
                <label>Title</label>
                <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select value={formType} onChange={(e) => setFormType(e.target.value)}>
                    {EVENT_TYPES.map((t) => (
                      <option key={t} value={t}>{t.replace("_", " ")}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Time</label>
                  <input type="time" value={formStartTime} onChange={(e) => setFormStartTime(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input type="time" value={formEndTime} onChange={(e) => setFormEndTime(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Room</label>
                  <input value={formRoom} onChange={(e) => setFormRoom(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label>Course</label>
                <select value={formCourseId} onChange={(e) => handleCourseChange(e.target.value ? Number(e.target.value) : "")} required>
                  <option value="">— select course —</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Specialty</label>
                  <select value={formSpecialtyId} onChange={(e) => setFormSpecialtyId(e.target.value ? Number(e.target.value) : "")} required>
                    <option value="">— select specialty —</option>
                    {specialties.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Year</label>
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
                  <label>Group (optional)</label>
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
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? "Saving..." : "Add Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
