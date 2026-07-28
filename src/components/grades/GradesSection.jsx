import { useCallback, useEffect, useState } from "react";
import Card from "../ui/Card";
import SectionHeader from "../ui/SectionHeader";
import StatCard from "../ui/StatCard";
import { gradesApi, groupsApi, lessonsApi } from "../../api/crmApi";
import { formatUzDate, toInputDate } from "../../utils/date";
import { useTheme } from "../../theme/themeContext";

const GRADE_TYPES = [
  { value: "LESSON", label: "Dars", icon: "📖" },
  { value: "HOMEWORK", label: "Uy vazifa", icon: "📝" },
  { value: "EXAM", label: "Imtihon", icon: "🧪" },
  { value: "BEHAVIOR", label: "Xulq", icon: "🙂" },
  { value: "OTHER", label: "Boshqa", icon: "⭐" },
];

const getTypeLabel = (type) =>
  GRADE_TYPES.find((item) => item.value === type)?.label || "Baho";

const EMPTY_FORM = {
  studentId: "",
  lessonId: "",
  type: "LESSON",
  score: "",
  maxScore: "100",
  comment: "",
  date: "",
};

const percentTone = (percent) => {
  if (percent >= 85) return "emerald";
  if (percent >= 60) return "amber";
  return "rose";
};

/**
 * O'qituvchi / admin uchun alohida baho qo'yish bo'limi (/grades).
 * Guruh tanlanadi, so'ng o'sha guruh o'quvchilariga baho qo'yiladi.
 */
export default function GradesSection({ groups = [], loading = false }) {
  const { theme, darkMode } = useTheme();

  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [students, setStudents] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [grades, setGrades] = useState([]);
  const [stats, setStats] = useState({ average: 0, averagePercent: 0 });
  const [gradesLoading, setGradesLoading] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selectedGroupId && groups.length > 0) {
      setSelectedGroupId(String(groups[0].id));
    }
  }, [groups, selectedGroupId]);

  const loadGrades = useCallback(async (groupId) => {
    if (!groupId) return;

    try {
      setGradesLoading(true);
      setError("");

      const [gradesRes, studentsRes, lessonsRes] = await Promise.allSettled([
        gradesApi.getByGroup(groupId),
        groupsApi.getStudentsByGroup(groupId),
        lessonsApi.getByGroup(groupId),
      ]);

      if (gradesRes.status === "fulfilled") {
        setGrades(
          Array.isArray(gradesRes.value?.data) ? gradesRes.value.data : [],
        );
        setStats({
          average: gradesRes.value?.average || 0,
          averagePercent: gradesRes.value?.averagePercent || 0,
        });
      } else {
        setGrades([]);
        setStats({ average: 0, averagePercent: 0 });
        setError(
          gradesRes.reason?.response?.data?.message ||
            "Baholarni yuklashda xatolik",
        );
      }

      setStudents(
        studentsRes.status === "fulfilled" &&
          Array.isArray(studentsRes.value?.data)
          ? studentsRes.value.data
          : [],
      );
      setLessons(
        lessonsRes.status === "fulfilled" &&
          Array.isArray(lessonsRes.value?.data)
          ? lessonsRes.value.data
          : [],
      );
    } finally {
      setGradesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedGroupId) loadGrades(selectedGroupId);
  }, [selectedGroupId, loadGrades]);

  const openForm = (grade) => {
    if (grade) {
      setEditingId(grade.id);
      setForm({
        studentId: String(grade.studentId ?? ""),
        lessonId: grade.lessonId ? String(grade.lessonId) : "",
        type: grade.type || "LESSON",
        score: String(grade.score ?? ""),
        maxScore: String(grade.maxScore ?? "100"),
        comment: grade.comment || "",
        date: toInputDate(grade.date),
      });
    } else {
      setEditingId(null);
      setForm(EMPTY_FORM);
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!editingId && !form.studentId) {
      alert("O'quvchi tanlanishi kerak");
      return;
    }

    if (String(form.score).trim() === "") {
      alert("Baho kiritilishi kerak");
      return;
    }

    try {
      setSaving(true);

      if (editingId !== null) {
        await gradesApi.update(editingId, {
          type: form.type,
          score: Number(form.score),
          maxScore: Number(form.maxScore || 100),
          comment: form.comment.trim() || undefined,
          date: form.date || undefined,
        });
      } else {
        await gradesApi.create({
          studentId: Number(form.studentId),
          groupId: Number(selectedGroupId),
          lessonId: form.lessonId ? Number(form.lessonId) : undefined,
          type: form.type,
          score: Number(form.score),
          maxScore: Number(form.maxScore || 100),
          comment: form.comment.trim() || undefined,
          date: form.date || undefined,
        });
      }

      await loadGrades(selectedGroupId);
      closeForm();
    } catch (err) {
      alert(err?.response?.data?.message || "Bahoni saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (grade) => {
    if (!window.confirm("Baho o'chirilsinmi?")) return;

    try {
      await gradesApi.remove(grade.id);
      await loadGrades(selectedGroupId);
    } catch (err) {
      alert(err?.response?.data?.message || "Bahoni o'chirishda xatolik");
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          icon="⭐"
          tone="violet"
          label="Qo'yilgan baholar"
          value={gradesLoading ? "..." : grades.length}
        />
        <StatCard
          icon="📊"
          tone="blue"
          label="O'rtacha ball"
          value={gradesLoading ? "..." : stats.average}
        />
        <StatCard
          icon="✅"
          tone={percentTone(stats.averagePercent)}
          label="O'rtacha foiz"
          value={gradesLoading ? "..." : `${stats.averagePercent}%`}
        />
      </div>

      <Card>
        <SectionHeader
          title="Alohida baho qo'yish"
          subtitle="Guruhni tanlab, o'quvchilarga baho qo'ying"
          action={
            <button
              type="button"
              onClick={() => (showForm ? closeForm() : openForm(null))}
              disabled={!selectedGroupId}
              className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60"
            >
              {showForm ? "Yopish" : "+ Baho qo'yish"}
            </button>
          }
        />

        <div className="mb-5">
          <label className={`block text-sm font-medium mb-2 ${theme.text}`}>
            Guruh
          </label>
          <select
            value={selectedGroupId}
            onChange={(event) => setSelectedGroupId(event.target.value)}
            className={`w-full sm:max-w-xs rounded-xl border px-4 py-3 outline-none ${theme.select}`}
          >
            <option value="">Guruhni tanlang</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>

        {showForm && (
          <div className={`rounded-2xl border p-4 mb-5 ${theme.rowBorder}`}>
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                name="studentId"
                value={form.studentId}
                onChange={handleChange}
                disabled={editingId !== null}
                className={`w-full rounded-xl border px-4 py-3 outline-none disabled:opacity-60 ${theme.select}`}
              >
                <option value="">O'quvchini tanlang</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.fullName}
                  </option>
                ))}
              </select>

              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className={`w-full rounded-xl border px-4 py-3 outline-none ${theme.select}`}
              >
                {GRADE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>

              <select
                name="lessonId"
                value={form.lessonId}
                onChange={handleChange}
                disabled={editingId !== null}
                className={`w-full rounded-xl border px-4 py-3 outline-none disabled:opacity-60 ${theme.select}`}
              >
                <option value="">Dars tanlanmagan</option>
                {lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.title || `Dars #${lesson.id}`}
                  </option>
                ))}
              </select>

              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className={`w-full rounded-xl border px-4 py-3 outline-none ${theme.input}`}
              />

              <input
                type="number"
                name="score"
                value={form.score}
                onChange={handleChange}
                placeholder="Baho (masalan: 85)"
                className={`w-full rounded-xl border px-4 py-3 outline-none ${theme.input}`}
              />

              <input
                type="number"
                name="maxScore"
                value={form.maxScore}
                onChange={handleChange}
                placeholder="Maksimal ball (100)"
                className={`w-full rounded-xl border px-4 py-3 outline-none ${theme.input}`}
              />
            </div>

            <textarea
              name="comment"
              value={form.comment}
              onChange={handleChange}
              rows={3}
              placeholder="Izoh (ixtiyoriy)"
              className={`w-full rounded-xl border px-4 py-3 mt-3 outline-none resize-none ${theme.input}`}
            />

            <div className="flex justify-end gap-3 mt-3">
              <button
                type="button"
                onClick={closeForm}
                className={`px-5 py-2.5 rounded-xl border text-sm ${theme.rowBorder} ${theme.hover} ${theme.text}`}
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium disabled:opacity-60"
              >
                {saving ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-rose-500 mb-4">{error}</p>}

        {loading || gradesLoading ? (
          <p className={`text-sm ${theme.soft}`}>Yuklanmoqda...</p>
        ) : !selectedGroupId ? (
          <p className={`text-sm ${theme.soft}`}>Avval guruhni tanlang</p>
        ) : grades.length === 0 ? (
          <p className={`text-sm ${theme.soft}`}>
            Bu guruhda hali baho qo'yilmagan
          </p>
        ) : (
          <div className="space-y-3">
            {grades.map((grade) => {
              const max = grade.maxScore || 100;
              const percent = Math.round((grade.score / max) * 100);

              return (
                <div
                  key={grade.id}
                  className={`rounded-2xl border p-4 ${theme.rowBorder}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`font-semibold ${theme.text}`}>
                        {grade.student?.fullName || "O'quvchi"}
                      </p>
                      <p className={`text-sm mt-1 ${theme.soft}`}>
                        {getTypeLabel(grade.type)}
                        {grade.lesson?.title ? ` · ${grade.lesson.title}` : ""} ·{" "}
                        {formatUzDate(grade.date)}
                      </p>
                      {grade.comment && (
                        <p className={`text-sm mt-1 ${theme.soft}`}>
                          💬 {grade.comment}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <p className={`text-2xl font-bold ${theme.text}`}>
                        {grade.score}
                        <span className={`text-sm font-normal ${theme.soft}`}>
                          /{max}
                        </span>
                      </p>
                      <p className={`text-xs ${theme.soft}`}>{percent}%</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => openForm(grade)}
                      className={`px-4 py-2 rounded-xl border text-sm ${theme.rowBorder} ${theme.hover} ${theme.text}`}
                    >
                      ✏️ Tahrirlash
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(grade)}
                      className={`px-4 py-2 rounded-xl border text-sm ${
                        darkMode
                          ? "border-slate-700 hover:bg-red-900/30 text-slate-300"
                          : "border-slate-200 hover:bg-red-50 text-slate-600"
                      }`}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
