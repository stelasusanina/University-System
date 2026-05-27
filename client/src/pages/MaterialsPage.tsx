import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import Navbar from "../components/Navbar";

interface MaterialItem {
  id: number;
  title: string;
  description: string | null;
  fileUrl: string;
  fileType: string;
  uploadedAt: string;
  course?: { id: number; code: string; name: string };
  academicStaff?: { firstName: string; lastName: string; title: string };
}

interface CourseWithMaterials {
  id: number;
  code: string;
  name: string;
  year: number;
  semester: number;
  type: string;
  academicStaff: { firstName: string; lastName: string; title: string };
  materials: MaterialItem[];
}

interface StaffCourse {
  id: number;
  code: string;
  name: string;
  year: number;
  semester: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STAFF_ROLES = ["PROFESSOR", "ASSOCIATE_PROFESSOR", "SENIOR_ASSISTANT", "ASSISTANT"];

function fileTypeLabel(type: string) {
  return type.toUpperCase();
}

function fileTypeBadgeClass(type: string) {
  const t = type.toLowerCase();
  if (t === "pdf") return "badge-pdf";
  if (t === "docx") return "badge-docx";
  if (t === "pptx") return "badge-pptx";
  return "badge-other";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("bg-BG", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// ── Staff view ────────────────────────────────────────────────────────────────

function StaffMaterialsView() {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [courses, setCourses] = useState<StaffCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openCourse, setOpenCourse] = useState<number | null>(null);

  // Upload form
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState<number | "">("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const coursesData = await api.get<StaffCourse[]>("/materials/staff-courses");
      setCourses(coursesData);
    } catch {
      setError("Неуспешно зареждане на дисциплини");
    }
    try {
      const materialsData = await api.get<MaterialItem[]>("/materials/my");
      setMaterials(materialsData);
    } catch {
      // materials list failing shouldn't prevent the upload form from working
    }
    setLoading(false);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !courseId || !file) {
      setFormError("Заглавие, дисциплина и файл са задължителни.");
      return;
    }
    setFormError("");
    setUploading(true);

    try {
      const form = new FormData();
      form.append("title", title);
      form.append("description", description);
      form.append("courseId", String(courseId));
      form.append("file", file);

      await api.postForm("/materials", form);
      setTitle("");
      setDescription("");
      setCourseId("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setShowForm(false);
      await loadData();
    } catch (err) {
      console.error("Upload error:", err);
      setFormError(err instanceof Error ? err.message : "Неуспешно качване");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: number, cId: number) {
    if (!confirm("Изтриване на материала? Това действие е необратимо.")) return;
    try {
      await api.delete(`/materials/${id}`);
      setMaterials((prev) => prev.filter((m) => m.id !== id));
      // Keep accordion open on the same course
      setOpenCourse(cId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неуспешно изтриване");
    }
  }

  // Group materials by course id
  const byCourse = new Map<number, MaterialItem[]>();
  for (const m of materials) {
    const cid = m.course?.id ?? 0;
    if (!byCourse.has(cid)) byCourse.set(cid, []);
    byCourse.get(cid)!.push(m);
  }

  return (
    <div className="materials-section">
      <div className="materials-header">
        <h2>Мои материали</h2>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? "Отказ" : "+ Качи файл"}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form className="material-form" onSubmit={handleUpload}>
          <h3>Качване на нов материал</h3>

          {formError && <div className="error-message">{formError}</div>}

          <label>
            Заглавие *
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="напр. Лекция 1 – Въведение в C++"
            />
          </label>

          <label>
            Дисциплина *
            <select
              value={courseId}
              onChange={(e) => setCourseId(Number(e.target.value))}
            >
              <option value="">Изберете дисциплина…</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} – {c.name} (Курс {c.year}, Сем {c.semester})
                </option>
              ))}
            </select>
          </label>

          <label>
            Описание
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Кратко описание (по избор)"
              rows={2}
            />
          </label>

          <label>
            Файл * <span className="hint">(PDF, DOCX, PPTX)</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.pptx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>

          <button type="submit" className="btn-primary" disabled={uploading}>
            {uploading ? "Качване…" : "Качи"}
          </button>
        </form>
      )}

      {loading && <p className="loading-text">Зареждане…</p>}

      {!loading && courses.length === 0 && (
        <p className="empty-text">Все още нямате назначени дисциплини.</p>
      )}

      {!loading && courses.length > 0 && (
        <div className="course-accordion">
          {courses.map((course) => {
            const courseMaterials = byCourse.get(course.id) ?? [];
            return (
              <div key={course.id} className="accordion-item">
                <button
                  type="button"
                  className="accordion-trigger"
                  onClick={() =>
                    setOpenCourse((prev) => (prev === course.id ? null : course.id))
                  }
                >
                  <span className="accordion-course-code">{course.code}</span>
                  <span className="accordion-course-name">{course.name}</span>
                  <span className="accordion-meta">Курс {course.year} · Сем {course.semester}</span>
                  <span className="accordion-count">
                    {courseMaterials.length} файл{courseMaterials.length !== 1 ? "а" : ""}
                  </span>
                  <span className="accordion-chevron">
                    {openCourse === course.id ? "▲" : "▼"}
                  </span>
                </button>

                {openCourse === course.id && (
                  <div className="accordion-body">
                    {courseMaterials.length === 0 ? (
                      <p className="empty-text">Все още няма качени материали за тази дисциплина.</p>
                    ) : (
                      <div className="materials-list">
                        {courseMaterials.map((m) => (
                          <div key={m.id} className="material-card">
                            <div className="material-card-main">
                              <span className={`file-type-badge ${fileTypeBadgeClass(m.fileType)}`}>
                                {fileTypeLabel(m.fileType)}
                              </span>
                              <div className="material-info">
                                <div className="material-title">{m.title}</div>
                                {m.description && (
                                  <div className="material-description">{m.description}</div>
                                )}
                                <div className="material-meta">
                                  <span>Качено на {formatDate(m.uploadedAt)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="material-actions">
                              <a
                                href={m.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-secondary"
                              >
                                Преглед / Изтегляне
                              </a>
                              <button
                                type="button"
                                className="btn-danger"
                                onClick={() => handleDelete(m.id, course.id)}
                              >
                                Изтрий
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StudentMaterialsView() {
  const [data, setData] = useState<{ semester: { name: string }; courses: CourseWithMaterials[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openCourse, setOpenCourse] = useState<number | null>(null);

  useEffect(() => {
    api.get<{ semester: { name: string }; courses: CourseWithMaterials[] }>("/materials/courses")
      .then(setData)
      .catch(() => setError("Неуспешно зареждане на материали"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="materials-section">
      <h2>Учебни материали</h2>

      {error && <div className="error-message">{error}</div>}
      {loading && <p className="loading-text">Зареждане…</p>}

      {!loading && data && (
        <>
          <p className="semester-label">{data.semester.name}</p>
          {data.courses.length === 0 && (
            <p className="empty-text">Няма записани дисциплини за този семестър.</p>
          )}
          <div className="course-accordion">
            {data.courses.map((course) => (
              <div key={course.id} className="accordion-item">
                <button
                  type="button"
                  className="accordion-trigger"
                  onClick={() =>
                    setOpenCourse((prev) => (prev === course.id ? null : course.id))
                  }
                >
                  <span className="accordion-course-code">{course.code}</span>
                  <span className="accordion-course-name">{course.name}</span>
                  <span className="accordion-count">
                    {course.materials.length} файл{course.materials.length !== 1 ? "а" : ""}
                  </span>
                  <span className="accordion-chevron">
                    {openCourse === course.id ? "▲" : "▼"}
                  </span>
                </button>

                {openCourse === course.id && (
                  <div className="accordion-body">
                    <div className="accordion-staff">
                      {course.academicStaff.title} {course.academicStaff.firstName}{" "}
                      {course.academicStaff.lastName}
                    </div>

                    {course.materials.length === 0 ? (
                      <p className="empty-text">Все още няма качени материали за тази дисциплина.</p>
                    ) : (
                      <div className="materials-list">
                        {course.materials.map((m) => (
                          <div key={m.id} className="material-card">
                            <div className="material-card-main">
                              <span className={`file-type-badge ${fileTypeBadgeClass(m.fileType)}`}>
                                {fileTypeLabel(m.fileType)}
                              </span>
                              <div className="material-info">
                                <div className="material-title">{m.title}</div>
                                {m.description && (
                                  <div className="material-description">{m.description}</div>
                                )}
                                <div className="material-meta">
                                  <span>Качено на {formatDate(m.uploadedAt)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="material-actions">
                              <a
                                href={m.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-primary"
                              >
                                Преглед / Изтегляне
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function MaterialsPage() {
  const { user } = useAuth();
  const isStaff = STAFF_ROLES.includes(user?.role ?? "");

  return (
    <div className="app-layout">
      <Navbar />

      <main className="home-main">
        {isStaff ? <StaffMaterialsView /> : <StudentMaterialsView />}
      </main>
    </div>
  );
}
