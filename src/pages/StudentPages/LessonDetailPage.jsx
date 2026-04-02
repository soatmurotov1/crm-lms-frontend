import { useState } from "react";
import { formatUzDateTime } from "../../utils/date";

export default function LessonDetailPage({
  lesson,
  onBack,
  userRole = "student",
}) {
  const [teacherNote, setTeacherNote] = useState(lesson?.description || "");
  const [studentNote, setStudentNote] = useState("");
  const [studentFile, setStudentFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveNote = async () => {
    if (!studentNote.trim() && !studentFile) {
      alert("Izoh matni yoki fayl majburiy");
      return;
    }

    try {
      setIsSaving(true);
      alert("Izoh saqlandi");
      setStudentNote("");
      setStudentFile(null);
    } catch (error) {
      alert(error?.response?.data?.message || "Xato yuz berdi");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-slate-200 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 mb-3"
            >
              ← Orqaga
            </button>
            <h1 className="text-2xl font-bold text-slate-900">
              {lesson?.topic || "Dars"}
            </h1>
          </div>
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 sm:p-5">
        {/* Video Section */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 overflow-hidden">
          {lesson?.videos?.[0]?.file ? (
            <video
              controls
              src={lesson.videos[0].file}
              className="w-full rounded-xl bg-black"
            />
          ) : (
            <div className="w-full rounded-xl bg-slate-200 text-slate-600 p-12 text-center">
              <p className="text-base font-medium">
                Bu dars uchun video mavjud emas
              </p>
            </div>
          )}

          {/* Topic */}
          <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-white">
            <p className="text-xs uppercase tracking-wide text-slate-500 font-medium">
              Dars mavzusi
            </p>
            <p className="text-lg font-semibold text-slate-900 mt-2">
              {lesson?.topic || "-"}
            </p>
            {lesson?.lessonDate && (
              <p className="text-sm text-slate-600 mt-2">
                📅 {formatUzDateTime(lesson.lessonDate)}
              </p>
            )}
          </div>
        </div>

        {/* Teacher's Notes Section */}
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
            👨‍🏫 O'qituvchining izohi
          </h2>

          {teacherNote ? (
            <div className="p-4 rounded-xl border border-amber-200 bg-white">
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                {teacherNote}
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-amber-200 bg-white/50 text-slate-500 text-center">
              <p className="text-sm">O'qituvchi hali izoh yozmaganlar</p>
            </div>
          )}
        </div>

        {userRole === "student" && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              👤 Mening izohim
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Izoh matni
                </label>
                <textarea
                  value={studentNote}
                  onChange={(e) => setStudentNote(e.target.value)}
                  placeholder="Dars haqida fikringizni yuboring..."
                  className="w-full rounded-xl border border-emerald-300 px-4 py-3 outline-none focus:border-emerald-500 resize-none"
                  rows="4"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Fayl yuklash (ixtiyoriy)
                </label>
                <input
                  type="file"
                  onChange={(e) => setStudentFile(e.target.files?.[0] || null)}
                  className="w-full rounded-xl border border-emerald-300 px-3 py-2 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-100 file:text-emerald-800 hover:file:bg-emerald-200"
                />
                {studentFile && (
                  <p className="text-xs text-emerald-600 mt-1">
                    ✓ {studentFile.name} tanlandi
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={isSaving || (!studentNote.trim() && !studentFile)}
                  onClick={handleSaveNote}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {isSaving ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Homework in this Lesson */}
        {lesson?.homeworks && lesson.homeworks.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              📝 Ushbu darsga oid uyga vazifalar
            </h2>

            <div className="space-y-3">
              {lesson.homeworks.map((homework) => (
                <div
                  key={homework.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-amber-300 transition"
                >
                  <p className="font-medium text-slate-900">{homework.title}</p>
                  <p className="text-sm text-slate-600 mt-1">
                    Tugash vaqti: {formatUzDateTime(homework.deadline)}
                  </p>
                  {homework.file && (
                    <a
                      href={homework.file}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-2 text-sm text-sky-600 hover:text-sky-700 font-medium"
                    >
                      📎 Faylni ko'rish
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
