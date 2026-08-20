import { useEffect, useMemo, useState } from "react";
import FileInput from "../../components/ui/FileInput";
import { examsApi, groupsApi } from "../../api/crmApi";
import { getAuthUserFromStorage } from "../../utils/authToken";
import { useTheme } from "../../theme/themeContext";

const emptyForm = {
  title: "",
  groupId: "",
  lessonId: "",
  startAt: "",
  endAt: "",
  description: "",
  file: null,
};

const toLocalDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const getExamState = (exam) => {
  const now = Date.now();
  const start = new Date(exam.startAt).getTime();
  const end = new Date(exam.endAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return "Unknown";
  if (now < start) return "Upcoming";
  if (now > end) return "Expired";
  return "Active";
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("uz-UZ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function ExamsPage() {
  const { theme } = useTheme();
  const authUser = useMemo(() => getAuthUserFromStorage(), []);
  const isAdmin = String(authUser?.role || "").toUpperCase() !== "TEACHER";
  const [groups, setGroups] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingExamId, setEditingExamId] = useState(null);
  const [form, setForm] = useState(emptyForm);


  useEffect(() => {
    let alive = true;
    const loadGroups = async () => {
      try {
        const result = await groupsApi.getAll("ALL");
        const list = Array.isArray(result?.data) ? result.data : [];
        const filtered = isAdmin
          ? list
          : list.filter((group) => group.teacherId === authUser?.id);

        if (!alive) return;
        setGroups(filtered);
        const firstGroupId = filtered[0]?.id ? String(filtered[0].id) : "";
        setSelectedGroupId((prev) => prev || firstGroupId);
      } catch {
        if (alive) setError("Guruhlar yuklanmadi");
      }
    };

    loadGroups();
    return () => {
      alive = false;
    };
  }, [authUser?.id, isAdmin]);

  useEffect(() => {
    let alive = true;
    const loadLessonsAndExams = async () => {
      if (!selectedGroupId) {
        setLessons([]);
        setExams([]);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const [lessonsResult, examsResult] = await Promise.all([
          groupsApi.getLessonsByGroup(selectedGroupId),
          examsApi.getByGroup(selectedGroupId),
        ]);

        if (!alive) return;
        setLessons(
          Array.isArray(lessonsResult?.data) ? lessonsResult.data : [],
        );
        setExams(Array.isArray(examsResult?.data) ? examsResult.data : []);
      } catch {
        if (alive) {
          setLessons([]);
          setExams([]);
          setError("Exam ma'lumotlari yuklanmadi");
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadLessonsAndExams();
    return () => {
      alive = false;
    };
  }, [selectedGroupId]);

  const selectedGroup = useMemo(
    () => groups.find((group) => String(group.id) === String(selectedGroupId)),
    [groups, selectedGroupId],
  );

  const clearForm = () => {
    setEditingExamId(null);
    setForm({
      ...emptyForm,
      groupId: selectedGroupId,
    });
  };

  useEffect(() => {
    if (!form.groupId && selectedGroupId) {
      setForm((prev) => ({ ...prev, groupId: selectedGroupId }));
    }
  }, [form.groupId, selectedGroupId]);

  const handleEdit = (exam) => {
    setEditingExamId(exam.id);
    setForm({
      title: exam.title || "",
      groupId: String(exam.groupId || selectedGroupId || ""),
      lessonId: String(exam.lessonId || ""),
      startAt: toLocalDateTime(exam.startAt),
      endAt: toLocalDateTime(exam.endAt),
      description: exam.description || "",
      file: null,
    });
  };

  const handleDelete = async (examId) => {
    if (!window.confirm("Examni o'chirishni tasdiqlaysizmi?")) return;
    try {
      await examsApi.remove(examId);
      const result = await examsApi.getByGroup(selectedGroupId);
      setExams(Array.isArray(result?.data) ? result.data : []);
    } catch {
      setError("Exam o'chirilmadi");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.groupId || !form.lessonId || !form.title.trim()) {
      setError("Guruh, dars va sarlavha majburiy");
      return;
    }
    if (!form.startAt || !form.endAt) {
      setError("Boshlanish va tugash vaqtini kiriting");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        title: form.title.trim(),
        groupId: Number(form.groupId),
        lessonId: Number(form.lessonId),
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
        description: form.description.trim() || undefined,
        file: form.file || undefined,
      };

      if (editingExamId) {
        await examsApi.update(editingExamId, payload);
      } else {
        await examsApi.create(payload);
      }

      const result = await examsApi.getByGroup(selectedGroupId);
      setExams(Array.isArray(result?.data) ? result.data : []);
      clearForm();
    } catch {
      setError("Exam saqlanmadi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`min-h-full p-6 ${theme.shell}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Exams</h2>
          <p className={`mt-1 text-sm ${theme.muted}`}>
            Admin va teacher uchun exam settings va student window boshqaruvi.
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className={`min-w-64 field`}
          >
            <option value="">Guruhni tanlang</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name || `Group ${group.id}`}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={clearForm}
            className={`rounded-xl px-4 py-3 font-medium ${theme.secondary}`}
          >
            Yangi exam
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-danger">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className={`rounded-3xl border p-5 shadow-sm ${theme.panel}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Examlar</h3>
              <p className={`text-sm ${theme.muted}`}>
                {selectedGroup ? selectedGroup.name : "Guruh tanlanmagan"}
              </p>
            </div>
            {loading && (
              <span className={`text-sm ${theme.muted}`}>Yuklanmoqda...</span>
            )}
          </div>

          <div className="space-y-3">
            {exams.length === 0 && !loading ? (
              <div
                className={`rounded-2xl border border-dashed p-6 text-sm ${theme.muted}`}
              >
                Exam topilmadi.
              </div>
            ) : (
              exams.map((exam) => {
                const examState = getExamState(exam);
                const canEdit = isAdmin || examState !== "Expired";
                return (
                  <div
                    key={exam.id}
                    className={`rounded-2xl border p-4 ${theme.panel}`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base font-semibold">
                            {exam.title}
                          </h4>
                          <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
                            {examState}
                          </span>
                        </div>
                        <div className={`mt-2 text-sm ${theme.muted}`}>
                          Lesson: {exam.lesson?.title || exam.lessonId || "-"}
                        </div>
                        <div className={`mt-1 text-sm ${theme.muted}`}>
                          {formatDateTime(exam.startAt)} -{" "}
                          {formatDateTime(exam.endAt)}
                        </div>
                        <div className={`mt-1 text-sm ${theme.muted}`}>
                          Responses: {exam._count?.responses || 0}
                        </div>
                        {exam.description && (
                          <div className="mt-2 text-sm">{exam.description}</div>
                        )}
                        {exam.file && (
                          <a
                            href={exam.file}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-block text-sm text-accent underline"
                          >
                            Attached file
                          </a>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={!canEdit}
                          onClick={() => handleEdit(exam)}
                          className={`rounded-xl px-4 py-2 text-sm font-medium ${canEdit ? theme.button : "bg-surface-3 text-fg-muted"}`}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(exam.id)}
                          className="rounded-xl bg-danger px-4 py-2 text-sm font-medium text-white hover:bg-danger"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className={`rounded-3xl border p-5 shadow-sm ${theme.panel}`}
        >
          <div className="mb-4">
            <h3 className="text-lg font-semibold">
              {editingExamId ? "Examni tahrirlash" : "Yangi exam yaratish"}
            </h3>
            <p className={`text-sm ${theme.muted}`}>
              Date va time ni o'zgartirish orqali student submit window
              boshqariladi.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label
                className={`mb-2 block text-sm font-medium ${theme.muted}`}
              >
                Title
              </label>
              <input
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
                className={`w-full field`}
                placeholder="Exam title"
              />
            </div>

            <div>
              <label
                className={`mb-2 block text-sm font-medium ${theme.muted}`}
              >
                Group
              </label>
              <select
                value={form.groupId}
                onChange={(e) => {
                  const nextGroupId = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    groupId: nextGroupId,
                    lessonId: "",
                  }));
                  setSelectedGroupId(nextGroupId);
                }}
                className={`w-full field`}
              >
                <option value="">Tanlang</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name || `Group ${group.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className={`mb-2 block text-sm font-medium ${theme.muted}`}
              >
                Lesson
              </label>
              <select
                value={form.lessonId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, lessonId: e.target.value }))
                }
                className={`w-full field`}
              >
                <option value="">Tanlang</option>
                {lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.title || `Lesson ${lesson.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  className={`mb-2 block text-sm font-medium ${theme.muted}`}
                >
                  Start at
                </label>
                <input
                  type="datetime-local"
                  value={form.startAt}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, startAt: e.target.value }))
                  }
                  className={`w-full field`}
                />
              </div>
              <div>
                <label
                  className={`mb-2 block text-sm font-medium ${theme.muted}`}
                >
                  End at
                </label>
                <input
                  type="datetime-local"
                  value={form.endAt}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, endAt: e.target.value }))
                  }
                  className={`w-full field`}
                />
              </div>
            </div>

            <div>
              <label
                className={`mb-2 block text-sm font-medium ${theme.muted}`}
              >
                Description
              </label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                className={`w-full field`}
                placeholder="Exam instructions"
              />
            </div>

            <div>
              <label
                className={`mb-2 block text-sm font-medium ${theme.muted}`}
              >
                Fayl
              </label>
              <FileInput
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    file: e.target.files?.[0] || null,
                  }))
                }
                hint="PDF, Word, Excel, PowerPoint yoki rasm"
              />
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className={`rounded-xl px-5 py-3 font-medium ${theme.button} disabled:opacity-60`}
            >
              {saving
                ? "Saving..."
                : editingExamId
                  ? "Update exam"
                  : "Create exam"}
            </button>
            {editingExamId && (
              <button
                type="button"
                onClick={clearForm}
                className={`rounded-xl px-5 py-3 font-medium ${theme.secondary}`}
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
