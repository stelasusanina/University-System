import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import RoomLocationCard, { type RoomLocation } from "../components/RoomLocationCard";

type ProgramResponse = {
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
    }>;
  }>;
};

type TimetableEntry = {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
  type: string;
  courseCode: string;
  courseName: string;
  lecturerName: string;
};

const dayOrder = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

const dayLabels: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
};

const hardcodedRoomLocations: Record<string, RoomLocation> = {
  "101": {
    room: "101",
    buildingName: "Main Academic Building",
    address: "1 University Square, Sofia",
    latitude: 42.6977,
    longitude: 23.3219,
    note: "First floor, north corridor.",
  },
  "201": {
    room: "201",
    buildingName: "Engineering корпус",
    address: "12 Studentski Blvd, Sofia",
    latitude: 42.6506,
    longitude: 23.3792,
    note: "Second floor, right after the central stairs.",
  },
  "A-301": {
    room: "A-301",
    buildingName: "Faculty A",
    address: "8 Akademik Ivan Geshov Blvd, Sofia",
    latitude: 42.685,
    longitude: 23.3045,
    note: "Third floor, west wing.",
  },
  TEST: {
    room: "TEST-101",
    buildingName: "Test Building",
    address: "15 Test Campus Blvd, Sofia",
    latitude: 42.6979,
    longitude: 23.3222,
    note: "Temporary hardcoded location for Leaflet integration testing.",
  },
};

function normalizeRoomKey(room: string): string {
  return room.trim().toUpperCase();
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [program, setProgram] = useState<ProgramResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<RoomLocation | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProgram = async () => {
      try {
        const response = await api.get<ProgramResponse>("/me/program");

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
  }, []);

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
        lecturerName: `${course.lecturer.title} ${course.lecturer.firstName} ${course.lecturer.lastName}`,
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

  const handleRoomClick = (room: string) => {
    const normalizedRoom = normalizeRoomKey(room);
    const location = hardcodedRoomLocations[normalizedRoom] ?? {
      ...hardcodedRoomLocations.TEST,
      room,
      note: `Temporary fallback map because room ${room} is not configured yet.`,
    };

    setError("");
    setSelectedRoom(location);
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
            <section className="program-card student-card">
              <h2>{program.student.firstName} {program.student.lastName}</h2>
              <p><strong>Faculty number:</strong> {program.student.facultyNumber}</p>
              <p><strong>Faculty:</strong> {program.student.faculty}</p>
              <p><strong>Specialty:</strong> {program.student.specialty}</p>
              <p><strong>Year / Group:</strong> {program.student.year} / {program.student.group}</p>
              <p><strong>Semester:</strong> {program.semester.name} ({program.semester.period} {program.semester.year})</p>
              <button
                type="button"
                className="test-location-button"
                onClick={() => setSelectedRoom(hardcodedRoomLocations.TEST)}
              >
                Open test room location
              </button>
            </section>

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
                                        <button
                                          type="button"
                                          className="room-link-button"
                                          onClick={() => handleRoomClick(entry.room)}
                                        >
                                          Room {entry.room}
                                        </button>
                                        <div className="timetable-meta">{entry.lecturerName}</div>
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

                  {selectedRoom && (
                    <RoomLocationCard
                      location={selectedRoom}
                      onClose={() => setSelectedRoom(null)}
                    />
                  )}
                </>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
