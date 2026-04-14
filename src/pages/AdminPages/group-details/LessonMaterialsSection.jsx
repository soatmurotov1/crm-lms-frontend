export default function LessonMaterialsSection({
  theme,
  darkMode,
  innerBorderClass,
  subTabClass,
  activeLessonTab,
  setActiveLessonTab,
  setLessonPage,
  setShowVideoUploadModal,
  homeworksLoading,
  homeworks,
  deletingHomeworkId,
  deleteHomework,
  videosLoading,
  videos,
  readOnly = false,
}) {
  return (
    <div
      className={`${theme.card} border rounded-2xl shadow-sm flex-1 min-h-0 overflow-hidden`}
    >
      <div
        className={`px-4 py-3 border-b ${innerBorderClass} flex items-center justify-between gap-3 flex-wrap`}
      >
        <div className="flex items-center gap-3 overflow-x-auto">
          <button
            onClick={() => setActiveLessonTab("uyga-vazifa")}
            className={subTabClass(activeLessonTab === "uyga-vazifa")}
          >
            Uyga vazifa
          </button>

          <button
            onClick={() => setActiveLessonTab("videolar")}
            className={subTabClass(activeLessonTab === "videolar")}
          >
            Videolar
          </button>
        </div>

        {!readOnly &&
          (activeLessonTab === "uyga-vazifa" ? (
            <button
              onClick={() => setLessonPage("create-homework")}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm"
            >
              Uyga vazifa qo‘shish
            </button>
          ) : (
            <button
              onClick={() => setShowVideoUploadModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm"
            >
              Qo‘shish
            </button>
          ))}
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-4">
        {activeLessonTab === "uyga-vazifa" && (
          <div className="overflow-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className={darkMode ? "bg-slate-800" : "bg-slate-50"}>
                <tr className={`border-b ${innerBorderClass}`}>
                  <th className={`text-left px-3 py-3 w-[50px] ${theme.text}`}>
                    #
                  </th>
                  <th className={`text-left px-3 py-3 ${theme.text}`}>Mavzu</th>
                  <th
                    className={`text-center px-3 py-3 w-[90px] ${theme.text}`}
                  >
                    👤
                  </th>
                  <th
                    className={`text-center px-3 py-3 w-[90px] ${theme.text}`}
                  >
                    Qabul qilingan
                  </th>
                  <th
                    className={`text-center px-3 py-3 w-[90px] ${theme.text}`}
                  >
                    Qaytarilgan
                  </th>
                  <th
                    className={`text-center px-3 py-3 w-[90px] ${theme.text}`}
                  >
                    Bajarmaganlar
                  </th>
                  <th
                    className={`text-center px-3 py-3 w-[90px] ${theme.text}`}
                  >
                    Kutayotganlar
                  </th>
                  <th className={`text-left px-3 py-3 w-[180px] ${theme.text}`}>
                    Berilgan vaqt
                  </th>
                  <th className={`text-left px-3 py-3 w-[180px] ${theme.text}`}>
                    Tugash vaqti
                  </th>
                  <th className={`text-left px-3 py-3 w-[150px] ${theme.text}`}>
                    Dars sanasi
                  </th>
                  {!readOnly && (
                    <th
                      className={`text-center px-3 py-3 w-[110px] ${theme.text}`}
                    >
                      Amal
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {homeworksLoading && (
                  <tr>
                    <td
                      colSpan={readOnly ? 10 : 11}
                      className={`px-3 py-6 text-center ${theme.soft}`}
                    >
                      Uyga vazifalar yuklanmoqda...
                    </td>
                  </tr>
                )}

                {homeworks.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`border-b ${theme.rowBorder} ${
                      darkMode ? "hover:bg-slate-800/40" : "hover:bg-slate-50"
                    }`}
                  >
                    <td className={`px-3 py-3 ${theme.text}`}>{index + 1}</td>

                    <td className="px-3 py-3">
                      <div
                        className={`w-full text-left rounded-md px-3 py-2 text-sm ${
                          darkMode
                            ? "bg-slate-800 text-slate-200"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {item.title}
                      </div>
                    </td>

                    <td className={`px-3 py-3 text-center ${theme.text}`}>
                      {item.total}
                    </td>
                    <td className={`px-3 py-3 text-center ${theme.text}`}>
                      {item.approved}
                    </td>
                    <td className={`px-3 py-3 text-center ${theme.text}`}>
                      {item.rejected}
                    </td>
                    <td className={`px-3 py-3 text-center ${theme.text}`}>
                      {item.notReviewed}
                    </td>
                    <td className={`px-3 py-3 text-center ${theme.text}`}>
                      {item.pending}
                    </td>
                    <td className={`px-3 py-3 ${theme.text}`}>
                      {item.assignedAt}
                    </td>
                    <td className={`px-3 py-3 ${theme.text}`}>
                      {item.deadline}
                    </td>
                    <td className={`px-3 py-3 ${theme.text}`}>
                      {item.lessonDate}
                    </td>
                    {!readOnly && (
                      <td className="px-3 py-3 text-center">
                        <button
                          disabled={deletingHomeworkId === item.id}
                          onClick={() => deleteHomework(item.id)}
                          className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs disabled:opacity-60"
                        >
                          {deletingHomeworkId === item.id
                            ? "O‘chirilmoqda..."
                            : "O‘chirish"}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}

                {homeworks.length === 0 && (
                  <tr>
                    <td
                      colSpan={readOnly ? 10 : 11}
                      className={`px-3 py-10 text-center ${theme.soft}`}
                    >
                      Uyga vazifalar hozircha yo‘q
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeLessonTab === "videolar" && (
          <div className="overflow-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className={darkMode ? "bg-slate-800" : "bg-slate-50"}>
                <tr className={`border-b ${innerBorderClass}`}>
                  <th className={`text-left px-3 py-3 ${theme.text}`}>
                    Video nomi
                  </th>
                  <th className={`text-left px-3 py-3 ${theme.text}`}>
                    Dars nomi
                  </th>
                  <th className={`text-left px-3 py-3 ${theme.text}`}>
                    Status
                  </th>
                  <th className={`text-left px-3 py-3 ${theme.text}`}>
                    Dars sanasi
                  </th>
                  <th className={`text-left px-3 py-3 ${theme.text}`}>
                    Qo‘shilgan vaqti
                  </th>
                </tr>
              </thead>

              <tbody>
                {videosLoading && (
                  <tr>
                    <td
                      colSpan={5}
                      className={`px-3 py-6 text-center ${theme.soft}`}
                    >
                      Videolar yuklanmoqda...
                    </td>
                  </tr>
                )}

                {videos.map((video) => (
                  <tr
                    key={video.id}
                    className={`border-b ${theme.rowBorder} ${
                      darkMode ? "hover:bg-slate-800/40" : "hover:bg-slate-50"
                    }`}
                  >
                    <td className={`px-3 py-3 ${theme.text}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-500">◔</span>
                        <a
                          href={video.file}
                          target="_blank"
                          rel="noreferrer"
                          className="underline cursor-pointer"
                        >
                          {video.name}
                        </a>
                      </div>
                    </td>
                    <td className={`px-3 py-3 ${theme.text}`}>
                      {video.lessonName}
                    </td>
                    <td className="px-3 py-3">
                      <span className="px-2 py-1 rounded-full text-[11px] bg-emerald-100 text-emerald-700">
                        {video.status}
                      </span>
                    </td>
                    <td className={`px-3 py-3 ${theme.text}`}>
                      {video.lessonDate}
                    </td>
                    <td className={`px-3 py-3 ${theme.text}`}>
                      {video.uploadedAt}
                    </td>
                  </tr>
                ))}

                {videos.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className={`px-3 py-10 text-center ${theme.soft}`}
                    >
                      Videolar hozircha yo‘q
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
