import { useMemo, useState } from "react";

export default function StudentGroups({
  groups,
  lessonsByGroup,
  selectedGroupId,
  selectedGroup,
  lessonsLoading,
  onSelectGroup,
  onClearSelection,
}) {
  const [search, setSearch] = useState("");
  const [homeworkStatusFilter, setHomeworkStatusFilter] = useState("ALL");

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("uz-UZ", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("uz-UZ", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;

    return groups.filter((group) => {
      const groupName = String(group.name || "").toLowerCase();
      const courseName = String(group.course?.name || "").toLowerCase();
      const teacherName = String(group.teacher?.fullName || "").toLowerCase();
      return (
        groupName.includes(q) ||
        courseName.includes(q) ||
        teacherName.includes(q)
      );
    });
  }, [groups, search]);

  const activeLessons = useMemo(() => {
    if (!selectedGroupId) return [];

    const lessonList = lessonsByGroup[String(selectedGroupId)] || [];

    return lessonList
      .filter((lesson) => {
        const title = String(lesson?.title || "")
          .trim()
          .toLowerCase();
        return title !== "zdfh";
      })
      .sort(
        (a, b) =>
          new Date(a?.created_at || 0).getTime() -
          new Date(b?.created_at || 0).getTime(),
      );
  }, [selectedGroupId, lessonsByGroup]);

  const lessonRows = useMemo(() => {
    return activeLessons.map((lesson) => {
      const title = String(lesson?.title || "");
      const titleLower = title.trim().toLowerCase();

      const videoCount = Array.isArray(lesson?.lessonVideos)
        ? lesson.lessonVideos.length
        : Number(lesson?.videoCount || 0);

      const homeworkList = Array.isArray(lesson?.homework)
        ? lesson.homework
        : [];
      const examLike =
        titleLower.includes("exam") || titleLower.includes("imtihon");

      const homeworkDeadline =
        homeworkList[0]?.deadlineAt ||
        homeworkList[0]?.deadline ||
        lesson?.homeworkDeadline ||
        lesson?.deadlineAt ||
        lesson?.deadline ||
        null;

      if (examLike) {
        return {
          id: lesson.id,
          topic: title || "-",
          videoCount,
          status: "EXAM",
          deadline: homeworkDeadline,
          lessonDate: lesson?.created_at,
        };
      }

      const hasHomework =
        homeworkList.length > 0 ||
        Boolean(
          lesson?.homeworkId || lesson?.homeworkTitle || homeworkDeadline,
        );

      return {
        id: lesson.id,
        topic: title || "-",
        videoCount,
        status: hasHomework ? "ASSIGNED" : "NOT_ASSIGNED",
        deadline: homeworkDeadline,
        lessonDate: lesson?.created_at,
      };
    });
  }, [activeLessons]);

  const filteredLessonRows = useMemo(() => {
    if (homeworkStatusFilter === "ALL") return lessonRows;
    return lessonRows.filter((row) => row.status === homeworkStatusFilter);
  }, [lessonRows, homeworkStatusFilter]);

  const statusBadge = (status) => {
    if (status === "ASSIGNED") {
      return (
        <span className="inline-flex items-center rounded-xl bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
          Berilgan
        </span>
      );
    }

    if (status === "EXAM") {
      return (
        <span className="inline-flex items-center rounded-xl bg-amber-200 px-3 py-1 text-sm font-semibold text-amber-900">
          Imtihon
        </span>
      );
    }

    return (
      <span className="inline-flex items-center rounded-xl bg-slate-600 px-3 py-1 text-sm font-semibold text-white">
        Berilmagan
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {!selectedGroupId ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-slate-900">Guruhlarim</h2>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Guruh qidirish..."
              className="w-full max-w-72 rounded-xl border border-slate-200 bg-white px-4 py-2.5 outline-none focus:border-amber-500"
            />
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-212.5 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-500">
                    #
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-500">
                    Guruh nomi
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-500">
                    Yo'nalishi
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-500">
                    O'qituvchi
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-500">
                    Boshlash vaqti
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredGroups.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      Sizga biriktirilgan guruh topilmadi
                    </td>
                  </tr>
                )}
                {filteredGroups.map((group, index) => {
                  const isActive = Number(selectedGroupId) === Number(group.id);
                  return (
                    <tr
                      key={group.id}
                      onClick={() => onSelectGroup(group)}
                      className={`border-t border-slate-200 cursor-pointer ${
                        isActive ? "bg-amber-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="px-4 py-3 text-slate-700">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {group.name}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {group.course?.name || "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {group.teacher?.fullName || "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {group.startDate
                          ? new Date(group.startDate).toLocaleDateString(
                              "uz-UZ",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <button
                type="button"
                onClick={onClearSelection}
                className="mb-2 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                ← Guruhlarga qaytish
              </button>
              <h2 className="text-2xl font-bold text-slate-900">
                {selectedGroup?.name || "Guruh darsliklari"}
              </h2>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4 sm:p-6">
            <div className="max-w-xs">
              <label
                htmlFor="homework-status"
                className="mb-2 block text-3 font-medium text-slate-600"
              >
                Uy vazifa statusi
              </label>
              <select
                id="homework-status"
                value={homeworkStatusFilter}
                onChange={(e) => setHomeworkStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg text-slate-800 outline-none focus:border-amber-500"
              >
                <option value="ALL">Barchasi</option>
                <option value="ASSIGNED">Berilgan</option>
                <option value="NOT_ASSIGNED">Berilmagan</option>
                <option value="EXAM">Imtihon</option>
              </select>
            </div>

            <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full min-w-237.5 text-[18px]">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-5 text-left font-semibold text-slate-900">
                      Mavzular
                    </th>
                    <th className="px-4 py-5 text-left font-semibold text-slate-900">
                      Video
                    </th>
                    <th className="px-4 py-5 text-left font-semibold text-slate-900">
                      Uyga vazifa Holati
                    </th>
                    <th className="px-4 py-5 text-left font-semibold text-slate-900">
                      Uyga vazifa tugash vaqti ↓
                    </th>
                    <th className="px-4 py-5 text-left font-semibold text-slate-900">
                      Dars sanasi ↑
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {lessonsLoading && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-slate-500"
                      >
                        Darslar yuklanmoqda...
                      </td>
                    </tr>
                  )}

                  {!lessonsLoading && filteredLessonRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-slate-500"
                      >
                        Bu filter bo'yicha ma'lumot topilmadi.
                      </td>
                    </tr>
                  )}

                  {!lessonsLoading &&
                    filteredLessonRows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-slate-200 last:border-b-0"
                      >
                        <td className="px-4 py-5 text-slate-900">
                          {row.topic}
                        </td>
                        <td className="px-4 py-5">
                          <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-sky-400 px-3 text-sky-500">
                            {row.videoCount}
                          </span>
                        </td>
                        <td className="px-4 py-5">{statusBadge(row.status)}</td>
                        <td className="px-4 py-5 text-slate-900">
                          {formatDateTime(row.deadline)}
                        </td>
                        <td className="px-4 py-5 text-slate-900">
                          {formatDate(row.lessonDate)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
