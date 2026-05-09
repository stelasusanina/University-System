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

export default function HomeStudentPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [highlightedDates, setHighlightedDates] = useState<Set<string>>(new Set());
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    api.get<EventsResponse>("/events/dates").then((res) => {
      setHighlightedDates(new Set(res.dates));
      setEvents(res.events);
    }).catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const selectedDateStr = selectedDate?.format("YYYY-MM-DD") ?? "";
  const selectedEvents = events.filter((e) => e.date.split("T")[0] === selectedDateStr);

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
          <Link to="/home" className="nav-link">Home</Link>
          <Link to="/schedule" className="nav-link">Schedule</Link>
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
        <section className="calendar-card home-calendar-card">
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
                </div>
              ))
            ) : (
              <p className="calendar-no-events">Nothing planned</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
