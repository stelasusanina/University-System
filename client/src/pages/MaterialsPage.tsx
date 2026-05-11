import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

// ── Types ─────────────────────────────────────────────────────────────────────

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
      setError("Failed to load courses");
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
      setFormError("Title, course and file are required.");
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
      setFormError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: number, cId: number) {
    if (!confirm("Delete this material? This cannot be undone.")) return;
    try {
      await api.delete(`/materials/${id}`);
      setMaterials((prev) => prev.filter((m) => m.id !== id));
      // Keep accordion open on the same course
      setOpenCourse(cId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
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
        <h2>My Materials</h2>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? "Cancel" : "+ Upload File"}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form className="material-form" onSubmit={handleUpload}>
          <h3>Upload new material</h3>

          {formError && <div className="error-message">{formError}</div>}

          <label>
            Title *
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Lecture 1 – Intro to C++"
            />
          </label>

          <label>
            Course *
            <select
              value={courseId}
              onChange={(e) => setCourseId(Number(e.target.value))}
            >
              <option value="">Select course…</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} – {c.name} (Year {c.year}, Sem {c.semester})
                </option>
              ))}
            </select>
          </label>

          <label>
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional short description"
              rows={2}
            />
          </label>

          <label>
            File * <span className="hint">(PDF, DOCX, PPTX)</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.pptx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>

          <button type="submit" className="btn-primary" disabled={uploading}>
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </form>
      )}

      {loading && <p className="loading-text">Loading…</p>}

      {!loading && courses.length === 0 && (
        <p className="empty-text">No courses assigned to you yet.</p>
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
                  <span className="accordion-meta">Year {course.year} · Sem {course.semester}</span>
                  <span className="accordion-count">
                    {courseMaterials.length} file{courseMaterials.length !== 1 ? "s" : ""}
                  </span>
                  <span className="accordion-chevron">
                    {openCourse === course.id ? "▲" : "▼"}
                  </span>
                </button>

                {openCourse === course.id && (
                  <div className="accordion-body">
                    {courseMaterials.length === 0 ? (
                      <p className="empty-text">No materials uploaded for this course yet.</p>
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
                                  <span>Uploaded {formatDate(m.uploadedAt)}</span>
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
                                View / Download
                              </a>
                              <button
                                type="button"
                                className="btn-danger"
                                onClick={() => handleDelete(m.id, course.id)}
                              >
                                Delete
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

// ── Student view ──────────────────────────────────────────────────────────────

function StudentMaterialsView() {
  const [data, setData] = useState<{ semester: { name: string }; courses: CourseWithMaterials[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openCourse, setOpenCourse] = useState<number | null>(null);

  useEffect(() => {
    api.get<{ semester: { name: string }; courses: CourseWithMaterials[] }>("/materials/courses")
      .then(setData)
      .catch(() => setError("Failed to load materials"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="materials-section">
      <h2>Course Materials</h2>

      {error && <div className="error-message">{error}</div>}
      {loading && <p className="loading-text">Loading…</p>}

      {!loading && data && (
        <>
          <p className="semester-label">{data.semester.name}</p>
          {data.courses.length === 0 && (
            <p className="empty-text">No courses enrolled this semester.</p>
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
                    {course.materials.length} file{course.materials.length !== 1 ? "s" : ""}
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
                      <p className="empty-text">No materials uploaded for this course yet.</p>
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
                                  <span>Uploaded {formatDate(m.uploadedAt)}</span>
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
                                View / Download
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

// ── Page shell ────────────────────────────────────────────────────────────────

export default function MaterialsPage() {
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
        <div className="top-nav-brand">University System</div>
        <div className="top-nav-links">
          <Link to="/home" className="nav-link">Home</Link>
          <Link to="/schedule" className="nav-link">Schedule</Link>
          {isStaff && (
            <Link to="/announcements" className="nav-link">Announcements</Link>
          )}
          <Link to="/materials" className="nav-link nav-link-active">Materials</Link>
        </div>
        <div className="top-nav-user">
          <span>{user?.email}</span>
          <button type="button" onClick={handleLogout} className="nav-logout-button">
            Logout
          </button>
        </div>
      </nav>

      <main className="home-main">
        {isStaff ? <StaffMaterialsView /> : <StudentMaterialsView />}
      </main>
    </div>
  );
}
