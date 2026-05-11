import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

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

interface Announcement {
  id: number;
  message: string;
  type: string;
  validTo: string;
  createdAt: string;
  course?: { code: string; name: string } | null;
  specialty?: { name: string };
  year: number;
  group: number | null;
}

const ANNOUNCEMENT_TYPES = ["INFO", "DELAY", "CANCELLATION", "ROOM_CHANGE", "URGENT"];

export default function ManageAnnouncementsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form state
  const [message, setMessage] = useState("");
  const [type, setType] = useState("INFO");
  const [validTo, setValidTo] = useState("");
  const [specialtyId, setSpecialtyId] = useState<number | "">("");
  const [year, setYear] = useState<number | "">("");
  const [group, setGroup] = useState<number | "">("");
  const [courseId, setCourseId] = useState<number | "">("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [announcementsData, optionsData] = await Promise.all([
        api.get<Announcement[]>("/announcements"),
        api.get<{ courses: Course[]; specialties: Specialty[] }>("/announcements/form-options"),
      ]);
      setAnnouncements(announcementsData);
      setCourses(optionsData.courses);
      setSpecialties(optionsData.specialties);
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setMessage("");
    setType("INFO");
    setValidTo("");
    setSpecialtyId("");
    setYear("");
    setGroup("");
    setCourseId("");
    setFormError("");
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(a: Announcement) {
    setMessage(a.message);
    setType(a.type);
    setValidTo(dayjs(a.validTo).format("YYYY-MM-DDTHH:mm"));
    const spec = specialties.find((s) => s.name === a.specialty?.name);
    setSpecialtyId(spec?.id ?? "");
    setYear(a.year);
    setGroup(a.group ?? "");
    const course = a.course ? courses.find((c) => c.name === a.course!.name) : null;
    setCourseId(course?.id ?? "");
    setEditingId(a.id);
    setFormError("");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!message.trim() || !validTo || !specialtyId || !year) {
      setFormError("Message, valid until, specialty, and year are required.");
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        message: message.trim(),
        type,
        validTo,
        specialtyId,
        year,
        group: group || null,
        courseId: courseId || null,
      };

      if (editingId) {
        await api.put(`/announcements/${editingId}`, body);
      } else {
        await api.post("/announcements", body);
      }

      resetForm();
      setLoading(true);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || "Failed to save announcement");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this announcement?")) return;
    try {
      await api.delete(`/announcements/${id}`);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch {
      setError("Failed to delete announcement");
    }
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const selectedSpecialty = specialties.find((s) => s.id === specialtyId);
  const yearOptions = selectedSpecialty ? Array.from({ length: selectedSpecialty.years }, (_, i) => i + 1) : [];
  const filteredCourses = specialtyId ? courses.filter((c) => c.specialtyId === specialtyId) : courses;

  return (
    <div className="app-layout">
      <nav className="top-nav">
        <div className="top-nav-brand">University System</div>
        <div className="top-nav-links">
          <Link to="/home" className="nav-link">Home</Link>
          <Link to="/schedule" className="nav-link">Schedule</Link>
          <Link to="/announcements" className="nav-link active">Announcements</Link>
        </div>
        <div className="top-nav-user">
          <span>{user?.email}</span>
          <button type="button" onClick={handleLogout} className="nav-logout-button">Logout</button>
        </div>
      </nav>

      <main className="home-main">
        <div className="manage-announcements-header">
          <h1>Manage Announcements</h1>
          {!showForm && (
            <button type="button" className="btn-primary" onClick={() => setShowForm(true)}>
              + New Announcement
            </button>
          )}
        </div>

        {error && <p className="error-message">{error}</p>}

        {showForm && (
          <form className="announcement-form" onSubmit={handleSubmit}>
            <h2>{editingId ? "Edit Announcement" : "New Announcement"}</h2>
            {formError && <p className="error-message">{formError}</p>}

            <div className="form-row">
              <div className="form-group">
                <label>Type</label>
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  {ANNOUNCEMENT_TYPES.map((t) => (
                    <option key={t} value={t}>{t.replace("_", " ")}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Valid Until</label>
                <input type="datetime-local" value={validTo} onChange={(e) => setValidTo(e.target.value)} required />
              </div>
            </div>

            <div className="form-group">
              <label>Message</label>
              <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your announcement..." required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Specialty</label>
                <select value={specialtyId} onChange={(e) => { setSpecialtyId(e.target.value ? Number(e.target.value) : ""); setYear(""); setCourseId(""); }} required>
                  <option value="">Select specialty</option>
                  {specialties.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Year</label>
                <select value={year} onChange={(e) => setYear(e.target.value ? Number(e.target.value) : "")} required disabled={!specialtyId}>
                  <option value="">Select year</option>
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Group (optional)</label>
                <input type="number" min="1" value={group} onChange={(e) => setGroup(e.target.value ? Number(e.target.value) : "")} placeholder="All groups" />
              </div>
            </div>

            <div className="form-group">
              <label>Course (optional)</label>
              <select value={courseId} onChange={(e) => setCourseId(e.target.value ? Number(e.target.value) : "")}>
                <option value="">No specific course</option>
                {filteredCourses.map((c) => (
                  <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? "Saving..." : editingId ? "Update" : "Create"}
              </button>
              <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        )}

        {loading ? (
          <p>Loading...</p>
        ) : announcements.length === 0 ? (
          <p className="calendar-no-events" style={{ marginTop: "1.5rem" }}>No active announcements</p>
        ) : (
          <div className="announcements-list">
            {announcements.map((a) => (
              <div key={a.id} className={`announcement-item announcement-${a.type.toLowerCase()}`}>
                <div className="announcement-header">
                  <span className={`announcement-badge announcement-badge-${a.type.toLowerCase()}`}>{a.type.replace("_", " ")}</span>
                  <span className="announcement-time">{dayjs(a.createdAt).format("D MMM, HH:mm")}</span>
                </div>
                <p className="announcement-message">{a.message}</p>
                <div className="announcement-meta">
                  {a.specialty && <span>{a.specialty.name}, Year {a.year}{a.group ? `, Group ${a.group}` : ""}</span>}
                  {a.course && <span> · {a.course.name}</span>}
                  <span className="announcement-valid-to">Valid until {dayjs(a.validTo).format("D MMM, HH:mm")}</span>
                </div>
                <div className="announcement-actions">
                  <button type="button" className="btn-icon" onClick={() => startEdit(a)} title="Edit">✏️</button>
                  <button type="button" className="btn-delete" onClick={() => handleDelete(a.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
