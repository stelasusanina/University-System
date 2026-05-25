import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.tsx";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../services/api.ts";
import type { BuildingInfo } from "../types/building";
import type { ProgramResponse, TimetableEntry } from "../types/schedule";

const dayOrder = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

const dayLabels: Record<string, string> = {
  MONDAY: "Понеделник",
  TUESDAY: "Вторник",
  WEDNESDAY: "Сряда",
  THURSDAY: "Четвъртък",
  FRIDAY: "Петък",
};


export default function SchedulePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [program, setProgram] = useState<ProgramResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isStudent = user?.role === "STUDENT";

  useEffect(() => {
    let isMounted = true;

    const loadProgram = async () => {
      try {
        const endpoint = isStudent ? "/student/program" : "/academic-staff/program";
        const response = await api.get<ProgramResponse>(endpoint);

        if (isMounted) {
          setProgram(response);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load program");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadProgram();

    return () => {
      isMounted = false;
    };
  }, [isStudent]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const timetableEntries: TimetableEntry[] =
    program?.courses.flatMap((course) =>
      course.schedules.map((schedule) => ({
        id: schedule.id,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        room: schedule.room,
        type: schedule.type,
        courseCode: course.code,
        courseName: course.name,
        lecturerName:
          "lecturer" in course
            ? `${course.lecturer.title} ${course.lecturer.firstName} ${course.lecturer.lastName}`
            : null,
        building: "building" in schedule ? (schedule.building as BuildingInfo | null) : null,
      })),
    ) ?? [];

  const timeSlots = Array.from(
    new Set(timetableEntries.map((entry) => `${entry.startTime}-${entry.endTime}`)),
  ).sort((left, right) => left.localeCompare(right));

  const timetableBySlot = new Map(
    timeSlots.map((slot) => [
      slot,
      new Map(
        dayOrder.map((day) => [
          day,
          timetableEntries.find(
            (entry) => `${entry.startTime}-${entry.endTime}` === slot && entry.dayOfWeek === day,
          ) ?? null,
        ]),
      ),
    ]),
  );

  const handleRoomClick = (entry: TimetableEntry) => {
    if (!entry.building) {
      setError(`No building data available for room ${entry.room}. Check that the room code starts with a valid building number.`);
      return;
    }
    setError("");
    const params = new URLSearchParams({
      lat: String(entry.building.latitude),
      lng: String(entry.building.longitude),
      name: entry.building.name,
      building: String(entry.building.number),
      room: entry.room,
      address: entry.building.address,
    });
    window.open(`/map?${params.toString()}`, "_blank", "noopener,noreferrer");
  };

  const isStaff = user?.role !== "STUDENT";

  return (
    <div className="app-layout">
      <nav className="top-nav">
        <div className="top-nav-brand">Университетска Система</div>
        <div className="top-nav-links">
          <Link to="/home" className="nav-link">Начало</Link>
          <Link to="/schedule" className="nav-link nav-link-active">Разписание</Link>
          {isStaff && <Link to="/announcements" className="nav-link">Съобщения</Link>}
          <Link to="/materials" className="nav-link">Материали</Link>
          <Link to="/grades" className="nav-link">Оценки</Link>
        </div>
        <div className="top-nav-user">
          <span>{user?.email}</span>
          <button type="button" onClick={handleLogout} className="nav-logout-button">Изход</button>
        </div>
      </nav>

      <main className="home-main">
        {loading && <p>Зареждане на разписание...</p>}

        {!loading && error && <div className="error-message">{error}</div>}

        {!loading && !error && program && (
          <div className="program-layout">
            <section className="program-card">
              <h2>Седмична програма</h2>
              {timetableEntries.length === 0 && <p>Все още няма записи в разписанието.</p>}

              {timetableEntries.length > 0 && (
                <>
                  <div className="timetable-wrapper">
                    <table className="timetable-table">
                      <thead>
                        <tr>
                          <th>Час</th>
                          {dayOrder.map((day) => (
                            <th key={day}>{dayLabels[day]}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {timeSlots.map((slot) => {
                          const [startTime, endTime] = slot.split("-");

                          return (
                            <tr key={slot}>
                              <td className="time-cell">
                                <strong>{startTime}</strong>
                                <span>{endTime}</span>
                              </td>
                              {dayOrder.map((day) => {
                                const entry = timetableBySlot.get(slot)?.get(day) ?? null;

                                return (
                                  <td key={`${slot}-${day}`}>
                                    {entry ? (
                                      <div className="timetable-entry">
                                        <div className="timetable-course-code">{entry.courseCode}</div>
                                        <div className="timetable-course-name">{entry.courseName}</div>
                                        <div className="timetable-meta">{entry.type}</div>
                                        {entry.building ? (
                                          <button
                                            type="button"
                                            className="room-link-button"
                                            onClick={() => handleRoomClick(entry)}
                                          >
                                            Зала {entry.room}
                                          </button>
                                        ) : (
                                          <div className="timetable-meta">Зала {entry.room}</div>
                                        )}
                                        {entry.lecturerName && (
                                          <div className="timetable-meta">{entry.lecturerName}</div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="timetable-empty">-</div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
