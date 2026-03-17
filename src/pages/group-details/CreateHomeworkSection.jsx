export default function CreateHomeworkSection({
  theme,
  inputClass,
  innerBorderClass,
  darkMode,
  setLessonPage,
  homeworkForm,
  setHomeworkForm,
  lessons,
  homeworkSaving,
  addHomework,
}) {
  return (
    <div
      className={`${theme.card} border rounded-2xl shadow-sm flex-1 min-h-0 overflow-auto p-4 sm:p-6`}
    >
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => setLessonPage("list")}
          className={`mb-6 ${theme.soft} hover:opacity-80 text-sm`}
        >
          ← Orqaga
        </button>

        <h2 className={`text-2xl font-bold mb-6 ${theme.text}`}>
          Yangi uyga vazifa yaratish
        </h2>

        <div className="space-y-6">
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme.text}`}>
              * Dars
            </label>
            <select
              className={inputClass}
              value={homeworkForm.lessonId}
              onChange={(e) =>
                setHomeworkForm({
                  ...homeworkForm,
                  lessonId: e.target.value,
                  title:
                    lessons.find(
                      (lesson) => Number(lesson.id) === Number(e.target.value),
                    )?.title || homeworkForm.title,
                })
              }
            >
              <option value="">Darslardan birini tanlang</option>
              {lessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${theme.text}`}>
              * Sarlavha
            </label>
            <input
              className={inputClass}
              placeholder="Uyga vazifa sarlavhasi"
              value={homeworkForm.title}
              onChange={(e) =>
                setHomeworkForm({ ...homeworkForm, title: e.target.value })
              }
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${theme.text}`}>
              Tugash muddati (soat)
            </label>
            <input
              type="number"
              min="1"
              className={inputClass}
              value={homeworkForm.durationTime}
              onChange={(e) =>
                setHomeworkForm({
                  ...homeworkForm,
                  durationTime: e.target.value,
                })
              }
            />
            <p className={`text-xs mt-2 ${theme.soft}`}>
              Default qiymat 16 soat. E&apos;lon qilingan vaqtdan shu soat
              qo&apos;shilib tugash vaqti hisoblanadi.
            </p>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${theme.text}`}>
              Fayl yuklash
            </label>

            <label
              className={`flex items-center justify-center w-full rounded-xl border border-dashed ${innerBorderClass} px-4 py-6 cursor-pointer ${darkMode ? "hover:bg-slate-800" : "hover:bg-slate-50"}`}
            >
              <input
                type="file"
                className="hidden"
                onChange={(e) =>
                  setHomeworkForm({
                    ...homeworkForm,
                    file: e.target.files?.[0] || null,
                  })
                }
              />
              <span className={theme.soft}>
                ⬇ Yuklash {homeworkForm.file?.name ? `- ${homeworkForm.file.name}` : ""}
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setLessonPage("list")}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
            >
              Bekor qilish
            </button>

            <button
              disabled={homeworkSaving}
              onClick={addHomework}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-60"
            >
              {homeworkSaving ? "Saqlanmoqda..." : "E&apos;lon qilish"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
