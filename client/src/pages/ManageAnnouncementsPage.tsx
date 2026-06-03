import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { api } from "../services/api";
import Navbar from "../components/Navbar";
import type { Announcement, Course, Specialty } from "@shared/types/announcements";

const ANNOUNCEMENT_TYPES = ["ИНФОРМАЦИЯ", "ЗАКЪСНЕНИЕ", "ОТМЯНА", "СМЯНА_НА_ЗАЛА", "СПЕШНО"];

const ANNOUNCEMENT_CSS: Record<string, string> = {
  "ИНФОРМАЦИЯ": "info",
  "ОТМЯНА": "cancellation",
  "ЗАКЪСНЕНИЕ": "delay",
  "СМЯНА_НА_ЗАЛА": "room_change",
  "СПЕШНО": "urgent",
};

export default function ManageAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form state
  const [message, setMessage] = useState("");
  const [type, setType] = useState("ИНФОРМАЦИЯ");
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
      setError("Неуспешно зареждане на данни");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setMessage("");
    setType("ИНФОРМАЦИЯ");
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
    setYear(a.year ?? "");
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
      setFormError("Съобщение, валидност, специалност и курс са задължителни.");
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
      setFormError(err.message || "Неуспешно запазване на съобщението");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Изтриване на това съобщение?")) return;
    try {
      await api.delete(`/announcements/${id}`);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch {
      setError("Неуспешно изтриване на съобщението");
    }
  }

  const selectedSpecialty = specialties.find((s) => s.id === specialtyId);
  const yearOptions = selectedSpecialty ? Array.from({ length: selectedSpecialty.years }, (_, i) => i + 1) : [];
  const filteredCourses = specialtyId ? courses.filter((c) => c.specialtyId === specialtyId) : courses;

  return (
    <div className="app-layout">
      <Navbar />

      <main className="home-main">
        <div className="manage-announcements-header">
          <h1>Управление на съобщения</h1>
          {!showForm && (
            <button type="button" className="btn-primary" onClick={() => setShowForm(true)}>
              + Ново съобщение
            </button>
          )}
        </div>

        {error && <p className="error-message">{error}</p>}

        {showForm && (
          <form className="announcement-form" onSubmit={handleSubmit}>
            <h2>{editingId ? "Редактиране на съобщение" : "Ново съобщение"}</h2>
            {formError && <p className="error-message">{formError}</p>}

            <div className="form-row">
              <div className="form-group">
                <label>Вид</label>
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  {ANNOUNCEMENT_TYPES.map((t) => (
                    <option key={t} value={t}>{t.replaceAll("_", " ")}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Валидно до</label>
                <input type="datetime-local" value={validTo} onChange={(e) => setValidTo(e.target.value)} required />
              </div>
            </div>

            <div className="form-group">
              <label>Съобщение</label>
              <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Напишете вашето съобщение..." required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Специалност</label>
                <select value={specialtyId} onChange={(e) => { setSpecialtyId(e.target.value ? Number(e.target.value) : ""); setYear(""); setCourseId(""); }} required>
                  <option value="">Изберете специалност</option>
                  {specialties.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Курс</label>
                <select value={year} onChange={(e) => setYear(e.target.value ? Number(e.target.value) : "")} required disabled={!specialtyId}>
                  <option value="">Изберете курс</option>
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Група (по избор)</label>
                <input type="number" min="1" value={group} onChange={(e) => setGroup(e.target.value ? Number(e.target.value) : "")} placeholder="Всички групи" />
              </div>
            </div>

            <div className="form-group">
              <label>Дисциплина (по избор)</label>
              <select value={courseId} onChange={(e) => setCourseId(e.target.value ? Number(e.target.value) : "")}>
                <option value="">Без конкретна дисциплина</option>
                {filteredCourses.map((c) => (
                  <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? "Запазване..." : editingId ? "Обнови" : "Създай"}
              </button>
              <button type="button" className="btn-secondary" onClick={resetForm}>Отказ</button>
            </div>
          </form>
        )}

        {loading ? (
          <p>Зареждане...</p>
        ) : !showForm && announcements.length === 0 ? (
          <p className="calendar-no-events" style={{ marginTop: "1.5rem" }}>Няма активни съобщения</p>
        ) : !showForm && (
          <div className="announcements-list">
            {announcements.map((a) => (
              <div key={a.id} className={`announcement-item announcement-${ANNOUNCEMENT_CSS[a.type] ?? a.type.toLowerCase()}`}>
                <div className="announcement-header">
                  <span className={`announcement-badge announcement-badge-${ANNOUNCEMENT_CSS[a.type] ?? a.type.toLowerCase()}`}>{a.type.replaceAll("_", " ")}</span>
                  <span className="announcement-time">{dayjs(a.createdAt).format("D MMM, HH:mm")}</span>
                </div>
                <p className="announcement-message">{a.message}</p>
                <div className="announcement-meta">
                  {a.specialty && <span>{a.specialty.name}, Курс {a.year}{a.group ? `, Група ${a.group}` : ""}</span>}
                  {a.course && <span> · {a.course.name}</span>}
                  <span className="announcement-valid-to">Валидно до {dayjs(a.validTo).format("D.M.YYYY, HH:mm")}</span>
                </div>
                <div className="announcement-actions">
                  <button type="button" className="btn-edit materials" onClick={() => startEdit(a)}>Редактирай</button>
                  <button type="button" className="btn-delete" onClick={() => handleDelete(a.id)}>Изтрий</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
