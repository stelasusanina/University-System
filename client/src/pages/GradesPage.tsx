import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import type { CourseRow, EnrollmentRow, SemesterGrades } from "@shared/types/grades";

const STAFF_ROLES = ["PROFESSOR", "ASSOCIATE_PROFESSOR", "SENIOR_ASSISTANT", "ASSISTANT"];

const ENROLLMENT_STATUSES = ["ЗАПИСАН", "ПОЛОЖЕН", "НЕПОЛОЖЕН", "ОТПИСАН"];

function gradeColor(grade: number | null) {
  if (grade === null) return "";
  if (grade >= 5) return "grade-excellent";
  if (grade >= 4) return "grade-good";
  if (grade >= 3) return "grade-average";
  return "grade-fail";
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "ПОЛОЖЕН": return "status-passed";
    case "НЕПОЛОЖЕН": return "status-failed";
    case "ОТПИСАН": return "status-withdrawn";
    default: return "status-enrolled";
  }
}

function StaffGradesView() {
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [semesterName, setSemesterName] = useState("");
  const [openCourse, setOpenCourse] = useState<number | null>(null);
  const [enrollments, setEnrollments] = useState<Record<number, EnrollmentRow[]>>({});
  const [loadingCourse, setLoadingCourse] = useState<number | null>(null);
  const [saving, setSaving] = useState<number | null>(null);
  const [editGrade, setEditGrade] = useState<Record<number, string>>({});
  const [editStatus, setEditStatus] = useState<Record<number, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ semester: { name: string }; courses: CourseRow[] }>("/grades/courses")
      .then((res) => { setSemesterName(res.semester.name); setCourses(res.courses); })
      .catch(() => setError("Неуспешно зареждане на дисциплини"))
      .finally(() => setLoading(false));
  }, []);

  async function openCourseGrades(courseId: number) {
    if (openCourse === courseId) { setOpenCourse(null); return; }
    setOpenCourse(courseId);
    if (enrollments[courseId]) return; // already loaded
    setLoadingCourse(courseId);
    try {
      const res = await api.get<{ enrollments: EnrollmentRow[] }>(`/grades/course/${courseId}`);
      setEnrollments((prev) => ({ ...prev, [courseId]: res.enrollments }));
      const gradeInit: Record<number, string> = {};
      const statusInit: Record<number, string> = {};
      for (const e of res.enrollments) {
        gradeInit[e.id] = e.grade !== null ? String(e.grade) : "";
        statusInit[e.id] = e.status;
      }
      setEditGrade((prev) => ({ ...prev, ...gradeInit }));
      setEditStatus((prev) => ({ ...prev, ...statusInit }));
    } catch {
      setError("Неуспешно зареждане на записванията");
    } finally {
      setLoadingCourse(null);
    }
  }

  async function handleSave(enrollmentId: number) {
    setSaving(enrollmentId);
    setError("");
    try {
      const gradeStr = editGrade[enrollmentId];
      const grade = gradeStr !== "" ? parseFloat(gradeStr) : null;
      const status = editStatus[enrollmentId];
      const updated = await api.put<EnrollmentRow>(`/grades/enrollment/${enrollmentId}`, { grade, status });

      // patch local state
      setEnrollments((prev) => {
        const next = { ...prev };
        for (const [cid, list] of Object.entries(next)) {
          next[Number(cid)] = list.map((e) => e.id === enrollmentId ? { ...e, grade: updated.grade, status: updated.status } : e);
        }
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неуспешно запазване");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="grades-section">
      <h2>Оценки</h2>
      {semesterName && <p className="semester-label">{semesterName}</p>}
      {error && <div className="error-message">{error}</div>}
      {loading && <p className="loading-text">Зареждане…</p>}

      {!loading && courses.length === 0 && (
        <p className="empty-text">Няма дисциплини за този семестър.</p>
      )}

      <div className="course-accordion">
        {courses.map((course) => (
          <div key={course.id} className="accordion-item">
            <button
              type="button"
              className="accordion-trigger"
              onClick={() => openCourseGrades(course.id)}
            >
              <span className="accordion-course-code">{course.code}</span>
              <span className="accordion-course-name">{course.name}</span>
              <span className="accordion-meta">Курс {course.year} · Сем {course.semester}</span>
              <span className="accordion-count">{course._count.enrollments} студенти</span>
              <span className="accordion-chevron">{openCourse === course.id ? "▲" : "▼"}</span>
            </button>

            {openCourse === course.id && (
              <div className="accordion-body">
                {loadingCourse === course.id && <p className="loading-text">Зареждане на студенти…</p>}

                {enrollments[course.id] && enrollments[course.id].length === 0 && (
                  <p className="empty-text">Няма записани студенти.</p>
                )}

                {enrollments[course.id] && enrollments[course.id].length > 0 && (() => {
                  // group students by their group number
                  const byGroup = new Map<number, EnrollmentRow[]>();
                  for (const e of enrollments[course.id]) {
                    const g = e.student.group;
                    if (!byGroup.has(g)) byGroup.set(g, []);
                    byGroup.get(g)!.push(e);
                  }
                  const sortedGroups = Array.from(byGroup.keys()).sort((a, b) => a - b);

                  return (
                  <table className="grades-table">
                    <thead>
                      <tr>
                        <th>Фак. №</th>
                        <th>Име</th>
                        <th>Курс</th>
                        <th>Оценка</th>
                        <th>Статус</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedGroups.map((group) => (
                        <>
                          <tr key={`group-${group}`} className="grades-group-header-row">
                            <td colSpan={6}>Група {group}</td>
                          </tr>
                          {byGroup.get(group)!.map((e) => (
                            <tr key={e.id}>
                              <td className="grade-faculty-num">{e.student.facultyNumber}</td>
                              <td>{e.student.firstName} {e.student.lastName}</td>
                              <td>{e.student.year}</td>
                              <td>
                                <input
                                  className="grade-input"
                                  type="number"
                                  min={2}
                                  max={6}
                                  step={0.5}
                                  placeholder="—"
                                  value={editGrade[e.id] ?? ""}
                                  onChange={(ev) =>
                                    setEditGrade((prev) => ({ ...prev, [e.id]: ev.target.value }))
                                  }
                                />
                              </td>
                              <td>
                                <select
                                  className="grade-status-select"
                                  value={editStatus[e.id] ?? e.status}
                                  onChange={(ev) =>
                                    setEditStatus((prev) => ({ ...prev, [e.id]: ev.target.value }))
                                  }
                                >
                                  {ENROLLMENT_STATUSES.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn-primary grade-save-btn"
                                  disabled={saving === e.id}
                                  onClick={() => handleSave(e.id)}
                                >
                                  {saving === e.id ? "…" : "Запази"}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </>
                      ))}
                    </tbody>
                  </table>
                  );
                })()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StudentGradesView() {
  const [semesters, setSemesters] = useState<SemesterGrades[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<{ semesters: SemesterGrades[] }>("/grades/my")
      .then((res) => setSemesters(res.semesters))
      .catch(() => setError("Неуспешно зареждане на оценките"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="grades-section">
      <h2>Моите оценки</h2>
      {error && <div className="error-message">{error}</div>}
      {loading && <p className="loading-text">Зареждане…</p>}
      {!loading && semesters.length === 0 && (
        <p className="empty-text">Няма намерени оценки.</p>
      )}

      {semesters.map((sg) => {
        const graded = sg.enrollments.filter((e) => e.grade !== null);
        const avg =
          graded.length > 0
            ? (graded.reduce((s, e) => s + e.grade!, 0) / graded.length).toFixed(2)
            : null;

        return (
          <div key={sg.semester.id} className="grades-semester-block">
            <div className="grades-semester-header">
              <span className="grades-semester-name">{sg.semester.name}</span>
              {avg && <span className="grades-avg">Среден успех: <strong>{avg}</strong></span>}
            </div>

            <table className="grades-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Course</th>
                  <th>Credits</th>
                  <th>Lecturer</th>
                  <th>Grade</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sg.enrollments.map((e) => (
                  <tr key={e.id}>
                    <td><span className="accordion-course-code">{e.course.code}</span></td>
                    <td>{e.course.name}</td>
                    <td>{e.course.credits}</td>
                    <td>{e.course.academicStaff.title} {e.course.academicStaff.lastName}</td>
                    <td>
                      <span className={`grade-value ${gradeColor(e.grade)}`}>
                        {e.grade !== null ? e.grade : "—"}
                      </span>
                    </td>
                    <td>
                      <span className={`enrollment-status-badge ${statusBadgeClass(e.status)}`}>
                        {e.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

// ── Page shell ────────────────────────────────────────────────────────────────

export default function GradesPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isStaff = STAFF_ROLES.includes(user?.role ?? "");

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="app-layout">
      <nav className="top-nav">
        <div className="top-nav-brand">Университетска Система</div>
        <div className="top-nav-links">
          <Link to="/home" className="nav-link">Начало</Link>
          <Link to="/schedule" className="nav-link">Разписание</Link>
          {isStaff && <Link to="/announcements" className="nav-link">Съобщения</Link>}
          <Link to="/materials" className="nav-link">Материали</Link>
          <Link to="/grades" className="nav-link nav-link-active">Оценки</Link>
        </div>
        <div className="top-nav-user">
          <span>{user?.email}</span>
          <button type="button" onClick={handleLogout} className="nav-logout-button">Изход</button>
        </div>
      </nav>

      <main className="home-main">
        {isStaff ? <StaffGradesView /> : <StudentGradesView />}
      </main>
    </div>
  );
}
