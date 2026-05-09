import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.tsx";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api.ts";

type BuildingInfo = {
  number: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  googleMapsUrl: string;
};

type StudentProgramResponse = {
  student: {
    id: number;
    facultyNumber: string;
    firstName: string;
    lastName: string;
    year: number;
    group: number;
    specialty: string;
    faculty: string;
  };
  semester: {
    id: number;
    name: string;
    year: number;
    period: string;
  };
  courses: Array<{
    id: number;
    code: string;
    name: string;
    description: string | null;
    credits: number;
    type: string;
    status: string;
    lecturer: {
      firstName: string;
      lastName: string;
      title: string;
    };
    schedules: Array<{
      id: number;
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      room: string;
      type: string;
      building: BuildingInfo | null;
    }>;
  }>;
};

type StaffProgramResponse = {
  staff: {
    id: number;
    staffNumber: string;
    firstName: string;
    lastName: string;
    title: string;
    faculty: string;
  };
  semester: {
    id: number;
    name: string;
    year: number;
    period: string;
  };
  courses: Array<{
    id: number;
    code: string;
    name: string;
    description: string | null;
    credits: number;
    type: string;
    specialty: string;
    schedules: Array<{
      id: number;
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      room: string;
      type: string;
    }>;
  }>;
};

type ProgramResponse = StudentProgramResponse | StaffProgramResponse;

type TimetableEntry = {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
  type: string;
  courseCode: string;
  courseName: string;
  lecturerName: string | null;
  building: BuildingInfo | null;
};

const dayOrder = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

const dayLabels: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
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

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="user-info">
          <span>{user?.email} ({user?.role})</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>
      <main>
        {loading && <p>Loading program...</p>}

        {!loading && error && <div className="error-message">{error}</div>}

        {!loading && !error && program && (
          <div className="program-layout">
            <section className="program-card">
              <h2>Weekly Program</h2>
              {timetableEntries.length === 0 && <p>No schedule entries yet.</p>}

              {timetableEntries.length > 0 && (
                <>
                  <div className="timetable-wrapper">
                    <table className="timetable-table">
                      <thead>
                        <tr>
                          <th>Time</th>
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
                                            Room {entry.room}
                                          </button>
                                        ) : (
                                          <div className="timetable-meta">Room {entry.room}</div>
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
