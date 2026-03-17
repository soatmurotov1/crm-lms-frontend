export default function VideoUploadModal({
  show,
  fileRef,
  onClose,
  videoForm,
  setVideoForm,
  lessons,
  videoSaving,
  handleVideoUpload,
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-xl border p-5 relative">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 text-2xl"
        >
          ×
        </button>

        <h3 className="text-lg font-semibold text-slate-800 mb-4">Qo'shish</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Darsni tanlang
          </label>
          <select
            value={videoForm.lessonId}
            onChange={(e) =>
              setVideoForm((prev) => ({ ...prev, lessonId: e.target.value }))
            }
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Darslardan birini tanlang</option>
            {lessons.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>
                {lesson.title}
              </option>
            ))}
          </select>
        </div>

        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-emerald-300 rounded-2xl p-10 sm:p-16 text-center cursor-pointer hover:bg-slate-50"
        >
          <div className="text-emerald-500 text-4xl mb-4">🧰</div>
          <p className="text-slate-700 text-base font-medium">
            Videofaylni yuklash uchun ushbu hudud ustiga bosing yoki faylni shu
            yerga olib keling
          </p>
          <p className="text-slate-400 text-sm mt-2">
            Videofayl .mp4, .webm, .mpeg, .avi, .mkv, .mov formatlaridan birida
            bo‘lishi kerak
          </p>

          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) =>
              setVideoForm((prev) => ({
                ...prev,
                file: e.target.files?.[0] || null,
              }))
            }
          />
        </div>

        {videoForm.file && (
          <p className="mt-3 text-sm text-slate-600">
            Tanlangan fayl: {videoForm.file.name}
          </p>
        )}

        <div className="flex justify-end mt-5 gap-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
          >
            Bekor qilish
          </button>
          <button
            disabled={videoSaving}
            onClick={handleVideoUpload}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-60"
          >
            {videoSaving ? "Yuklanmoqda..." : "Saqlash"}
          </button>
        </div>
      </div>
    </div>
  );
}
