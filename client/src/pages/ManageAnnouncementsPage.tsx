import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { api } from "../services/api";
import Navbar from "../components/Navbar";
import type { Announcement } from "@shared/types/announcements";

type CourseGroupOption = {
  id: number;
  semesterNum: number;
  course: { id: number; code: string; name: string };
  group: { id: number; number: number; studyYear: number; specialty: { id: number; name: string } };
};

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
  const [courseGroups, setCourseGroups] = useState<CourseGroupOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [message, setMessage] = useState("");
  const [type, setType] = useState("ИНФОРМАЦИЯ");
  const [validTo, setValidTo] = useState("");
  const [courseGroupId, setCourseGroupId] = useState<number | "">("");
  const [selectedGroupKey, setSelectedGroupKey] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [announcementsData, optionsData] = await Promise.all([
        api.get<Announcement[]>("/announcements"),
        api.get<{ courseGroups: CourseGroupOption[] }>("/announcements/form-options"),
      ]);
      setAnnouncements(announcementsData);
      setCourseGroups(optionsData.courseGroups);
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
    setCourseGroupId("");
    setSelectedGroupKey("");
    setFormError("");
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(a: Announcement) {
    setMessage(a.message);
    setType(a.type);
    setValidTo(dayjs(a.validTo).format("YYYY-MM-DDTHH:mm"));
    if (a.courseGroup?.id && a.courseGroup.group) {
      setSelectedGroupKey(`${a.courseGroup.group.studyYear}-${a.courseGroup.group.number}`);
      setCourseGroupId(a.courseGroup.id);
    } else {
      setSelectedGroupKey("");
      setCourseGroupId("");
    }
    setEditingId(a.id);
    setFormError("");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!message.trim() || !validTo) {
      setFormError("Съобщение и валидност са задължителни.");
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        message: message.trim(),
        type,
        validTo,
        courseGroupId: courseGroupId || null,
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

  return (
    <div className="app-layout">
      <Navbar />

      <main className="home-main">
        <div className="manage-announcements-header">
          <h2>Управление на съобщения</h2>
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
                <label>Група *</label>
                <select
                  value={selectedGroupKey}
                  onChange={(e) => {
                    setSelectedGroupKey(e.target.value);
                    setCourseGroupId("");
                  }}
                  required
                >
                  <option value="">Изберете група...</option>
                  {[...new Map(courseGroups.map((cg) => {
                    const key = `${cg.group.studyYear}-${cg.group.number}`;
                    return [key, cg];
                  })).values()].map((cg) => {
                    const key = `${cg.group.studyYear}-${cg.group.number}`;
                    return (
                      <option key={key} value={key}>
                        Курс {cg.group.studyYear}, Група {cg.group.number}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="form-group">
                <label>Предмет *</label>
                <select
                  value={courseGroupId}
                  onChange={(e) => setCourseGroupId(e.target.value ? Number(e.target.value) : "")}
                  disabled={!selectedGroupKey}
                  required
                >
                  <option value="">Изберете предмет...</option>
                  {courseGroups
                    .filter((cg) => `${cg.group.studyYear}-${cg.group.number}` === selectedGroupKey)
                    .map((cg) => (
                      <option key={cg.id} value={cg.id}>
                        {cg.course.name}
                      </option>
                    ))}
                </select>
              </div>
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
                  {a.courseGroup?.group && (
                    <span>
                      {a.courseGroup.group.specialty.name}, Курс {a.courseGroup.group.studyYear}, Група {a.courseGroup.group.number}
                    </span>
                  )}
                  {a.courseGroup?.course && <span> · {a.courseGroup.course.name}</span>}
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
