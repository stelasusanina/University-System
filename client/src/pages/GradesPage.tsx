import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import type { CourseWithGroups, StudentRow, SemesterGrades, GradeEntry } from "@shared/types/grades";
import Navbar from "../components/Navbar";

const STAFF_ROLES = ["ПРОФЕСОР", "ДОЦЕНТ", "ГЛАВЕН_АСИСТЕНТ", "АСИСТЕНТ"];

function gradeColor(grade: number) {
  if (grade >= 5) return "grade-excellent";
  if (grade >= 4) return "grade-good";
  if (grade >= 3) return "grade-average";
  return "grade-fail";
}

function StaffGradesView() {
  const [courses, setCourses] = useState<CourseWithGroups[]>([]);
  const [semesterName, setSemesterName] = useState("");
  const [openCourse, setOpenCourse] = useState<number | null>(null);
  const [openCourseGroup, setOpenCourseGroup] = useState<number | null>(null);
  const [students, setStudents] = useState<Record<number, StudentRow[]>>({});
  const [loadingGroup, setLoadingGroup] = useState<number | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [editGrade, setEditGrade] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ semester: { name: string }; courses: CourseWithGroups[] }>("/grades/courses")
      .then((res) => { setSemesterName(res.semester.name); setCourses(res.courses); })
      .catch(() => setError("Неуспешно зареждане на дисциплини"))
      .finally(() => setLoading(false));
  }, []);

  async function openGroup(courseGroupId: number) {
    if (openCourseGroup === courseGroupId) { setOpenCourseGroup(null); return; }
    setOpenCourseGroup(courseGroupId);
    if (students[courseGroupId]) return;
    setLoadingGroup(courseGroupId);
    try {
      const res = await api.get<{ students: StudentRow[] }>(`/grades/course-group/${courseGroupId}`);
      setStudents((prev) => ({ ...prev, [courseGroupId]: res.students }));
      const init: Record<string, string> = {};
      for (const s of res.students) {
        init[`${s.id}-${courseGroupId}`] = s.grade?.finalGrade != null ? String(s.grade.finalGrade) : "";
      }
      setEditGrade((prev) => ({ ...prev, ...init }));
    } catch {
      setError("Неуспешно зареждане на студенти");
    } finally {
      setLoadingGroup(null);
    }
  }

  async function handleSave(studentId: number, courseGroupId: number) {
    const key = `${studentId}-${courseGroupId}`;
    setSaving(key);
    setError("");
    try {
      const gradeStr = editGrade[key];
      const grade = gradeStr !== "" ? parseFloat(gradeStr) : null;
      await api.put("/grades/", { studentId, courseGroupId, grade });
      setStudents((prev) => {
        const next = { ...prev };
        if (next[courseGroupId]) {
          next[courseGroupId] = next[courseGroupId].map((s) =>
            s.id === studentId
              ? { ...s, grade: grade !== null ? { id: s.grade?.id ?? 0, finalGrade: grade } : null }
              : s,
          );
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
              onClick={() => setOpenCourse((prev) => (prev === course.id ? null : course.id))}
            >
              <span className="accordion-course-code">{course.code}</span>
              <span className="accordion-course-name">{course.name}</span>
              <span className="accordion-count">{course.courseGroups.length} групи</span>
              <span className="accordion-chevron">{openCourse === course.id ? "▲" : "▼"}</span>
            </button>

            {openCourse === course.id && (
              <div className="accordion-body">
                {course.courseGroups.map((cg) => (
                  <div key={cg.id} className="accordion-item">
                    <button
                      type="button"
                      className="accordion-trigger"
                      onClick={() => openGroup(cg.id)}
                    >
                      <span className="accordion-course-name">
                        {cg.group.specialty.name} · Курс {cg.group.studyYear} · Група {cg.group.number}
                      </span>
                      <span className="accordion-meta">Сем. {cg.semesterNum}</span>
                      <span className="accordion-count">{cg._count.grades} оценки</span>
                      <span className="accordion-chevron">{openCourseGroup === cg.id ? "▲" : "▼"}</span>
                    </button>

                    {openCourseGroup === cg.id && (
                      <div className="accordion-body">
                        {loadingGroup === cg.id && <p className="loading-text">Зареждане на студенти…</p>}

                        {students[cg.id] && students[cg.id].length === 0 && (
                          <p className="empty-text">Няма записани студенти.</p>
                        )}

                        {students[cg.id] && students[cg.id].length > 0 && (
                          <table className="grades-table">
                            <thead>
                              <tr>
                                <th>Фак. №</th>
                                <th>Ime</th>
                                <th>Оценка</th>
                                <th></th>
                              </tr>
                            </thead>
                            <tbody>
                              {students[cg.id].map((s) => {
                                const key = `${s.id}-${cg.id}`;
                                return (
                                  <tr key={s.id}>
                                    <td className="grade-faculty-num">{s.facultyNumber}</td>
                                    <td>{s.firstName} {s.lastName}</td>
                                    <td>
                                      <input
                                        className="grade-input"
                                        type="number"
                                        min={2}
                                        max={6}
                                        step={0.5}
                                        placeholder="—"
                                        value={editGrade[key] ?? ""}
                                        onChange={(ev) =>
                                          setEditGrade((prev) => ({ ...prev, [key]: ev.target.value }))
                                        }
                                      />
                                    </td>
                                    <td>
                                      <button
                                        type="button"
                                        className="btn-primary grade-save-btn"
                                        disabled={saving === key}
                                        onClick={() => handleSave(s.id, cg.id)}
                                      >
                                        {saving === key ? "…" : "Запази"}
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                ))}
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
        const avg =
          sg.grades.length > 0
            ? (sg.grades.reduce((s, e) => s + e.finalGrade, 0) / sg.grades.length).toFixed(2)
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
                </tr>
              </thead>
              <tbody>
                {sg.grades.map((e: GradeEntry) => (
                  <tr key={e.id}>
                    <td><span className="accordion-course-code">{e.course.code}</span></td>
                    <td>{e.course.name}</td>
                    <td>{e.course.credits}</td>
                    <td>{e.course.academicStaff.role} {e.course.academicStaff.lastName}</td>
                    <td>
                      <span className={`grade-value ${gradeColor(e.finalGrade)}`}>
                        {e.finalGrade}
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

export default function GradesPage() {
  const { user } = useAuth();
  const isStaff = STAFF_ROLES.includes(user?.role ?? "");

  return (
    <div className="app-layout">
      <Navbar />

      <main className="home-main">
        {isStaff ? <StaffGradesView /> : <StudentGradesView />}
      </main>
    </div>
  );
}
