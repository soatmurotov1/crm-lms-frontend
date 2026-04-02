import { useEffect, useMemo, useState } from "react";
import {
  groupsApi,
  homeworkApi,
  homeworkResponseApi,
  lessonVideosApi,
} from "../../api/crmApi";
import { formatUzDate, formatUzDateTime } from "../../utils/date";
import LessonDetailPage from "./LessonDetailPage";
import StudentDashboard from "./StudentDashboard";

const GROUP_CONTENT_CACHE_KEY = "student_group_content_cache_v1";
const GROUP_CONTENT_CACHE_TTL = 1000 * 60 * 10;

const tabs = [
  { key: "ACTIVE", label: "Faol" },
  { key: "COMPLETED", label: "Tugagan" },
];

const getGroupStatus = (group) => {
  const status = String(group?.status || "").toUpperCase();

  if (status === "INACTIVE" || status === "FREEZE") {
    return "COMPLETED";
  }

  return "ACTIVE";
};

const formatDate = (value) => {
  return formatUzDate(value, {
    month: "short",
  });
};

export default function StudentGroups({ groups = [] }) {
  const [activeTab, setActiveTab] = useState("ACTIVE");
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [selectedLessonDetail, setSelectedLessonDetail] = useState(null);
  const [groupContentById, setGroupContentById] = useState({});
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [homeworkStatusFilter, setHomeworkStatusFilter] = useState("ALL");
  const [myResponses, setMyResponses] = useState({});
  const [submissionTitle, setSubmissionTitle] = useState("");
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submissionSaving, setSubmissionSaving] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  const readGroupCache = () => {
    try {
      const raw = localStorage.getItem(GROUP_CONTENT_CACHE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  };

  const writeGroupCache = (nextCache) => {
    try {
      localStorage.setItem(GROUP_CONTENT_CACHE_KEY, JSON.stringify(nextCache));
    } catch {
      // Ignore storage errors and keep app usable.
    }
  };

  const filteredGroups = useMemo(() => {
    const query = search.trim().toLowerCase();

    return groups
      .filter((group) => getGroupStatus(group) === activeTab)
      .filter((group) => {
        if (!query) return true;

        const name = String(group?.name || "").toLowerCase();
        const course = String(group?.course?.name || "").toLowerCase();
        const teacher = String(
          group?.teacher?.fullName || group?.teacher?.name || "",
        ).toLowerCase();

        return (
          name.includes(query) ||
          course.includes(query) ||
          teacher.includes(query)
        );
      });
  }, [groups, activeTab, search]);

  useEffect(() => {
    if (!selectedGroup?.id) return;

    const groupKey = String(selectedGroup.id);
    if (groupContentById[groupKey]) return;

    const loadLessons = async () => {
      const cache = readGroupCache();
      const cacheItem = cache[groupKey];
      const isCacheValid =
        cacheItem &&
        Date.now() - Number(cacheItem.cachedAt || 0) < GROUP_CONTENT_CACHE_TTL;

      if (isCacheValid) {
        setGroupContentById((prev) => ({
          ...prev,
          [groupKey]: {
            lessons: Array.isArray(cacheItem.lessons) ? cacheItem.lessons : [],
            videos: Array.isArray(cacheItem.videos) ? cacheItem.videos : [],
            homeworks: Array.isArray(cacheItem.homeworks)
              ? cacheItem.homeworks
              : [],
          },
        }));
        return;
      }

      try {
        setLessonsLoading(true);
        const [lessonsResult, videosResult, homeworksResult] =
          await Promise.allSettled([
            groupsApi.getLessonsByGroup(selectedGroup.id),
            lessonVideosApi.getByGroup(selectedGroup.id),
            homeworkApi.getByGroup(selectedGroup.id),
          ]);

        const lessons =
          lessonsResult.status === "fulfilled" &&
          Array.isArray(lessonsResult.value?.data)
            ? lessonsResult.value.data
            : [];

        const videos =
          videosResult.status === "fulfilled" &&
          Array.isArray(videosResult.value?.data)
            ? videosResult.value.data
            : [];

        const homeworks =
          homeworksResult.status === "fulfilled" &&
          Array.isArray(homeworksResult.value?.data)
            ? homeworksResult.value.data
            : [];

        setGroupContentById((prev) => ({
          ...prev,
          [groupKey]: {
            lessons,
            videos,
            homeworks,
          },
        }));

        const nextCache = {
          ...cache,
          [groupKey]: {
            lessons,
            videos,
            homeworks,
            cachedAt: Date.now(),
          },
        };
        writeGroupCache(nextCache);
      } catch {
        setGroupContentById((prev) => ({
          ...prev,
          [groupKey]: {
            lessons: [],
            videos: [],
            homeworks: [],
          },
        }));
      } finally {
        setLessonsLoading(false);
      }
    };

    loadLessons();
  }, [selectedGroup, groupContentById]);

  const selectedGroupKey = String(selectedGroup?.id || "");
  const selectedGroupContent = groupContentById[selectedGroupKey] || {
    lessons: [],
    videos: [],
    homeworks: [],
  };

  const getHomeworkDeadline = (homework) => {
    if (!homework?.created_at) return null;

    const createdDate = new Date(homework.created_at);
    if (Number.isNaN(createdDate.getTime())) return null;

    const durationHours = Number(homework.durationTime || 0);
    if (!Number.isFinite(durationHours) || durationHours <= 0) return null;

    return new Date(createdDate.getTime() + durationHours * 60 * 60 * 1000);
  };

  const formatDateTime = (value) => {
    const raw = formatUzDateTime(value, { month: "short" });

    const matched = raw.match(
      /^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4}),\s+(\d{2}:\d{2})$/,
    );

    if (!matched) return raw;

    const [, day, month, year, time] = matched;
    const normalizedMonth =
      month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();

    return `${day} ${normalizedMonth}, ${year} ${time}`;
  };

  const lessonRows = useMemo(() => {
    if (!selectedGroup?.id) return [];

    const lessonList = Array.isArray(selectedGroupContent.lessons)
      ? selectedGroupContent.lessons
      : [];
    const videos = Array.isArray(selectedGroupContent.videos)
      ? selectedGroupContent.videos
      : [];
    const homeworks = Array.isArray(selectedGroupContent.homeworks)
      ? selectedGroupContent.homeworks
      : [];

    return lessonList
      .map((lesson) => {
        const title = String(lesson?.title || "");
        const titleLower = title.trim().toLowerCase();
        const lessonId = Number(lesson?.id);

        const lessonVideos = videos.filter(
          (video) => Number(video?.lessonId) === lessonId,
        );

        const homeworkList = homeworks.filter(
          (homework) => Number(homework?.lessonId) === lessonId,
        );

        const examLike =
          titleLower.includes("exam") || titleLower.includes("imtihon");

        const homeworkDeadline = getHomeworkDeadline(homeworkList[0]);

        if (examLike) {
          return {
            id: lesson.id,
            topic: title || "-",
            videoCount: lessonVideos.length,
            status: "EXAM",
            deadline: homeworkDeadline,
            lessonDate: lesson?.created_at,
            videos: lessonVideos,
            homeworks: homeworkList,
          };
        }

        const hasHomework = homeworkList.length > 0;

        return {
          id: lesson.id,
          topic: title || "-",
          videoCount: lessonVideos.length,
          status: hasHomework ? "ASSIGNED" : "NOT_ASSIGNED",
          deadline: homeworkDeadline,
          lessonDate: lesson?.created_at,
          videos: lessonVideos,
          homeworks: homeworkList,
        };
      })
      .sort(
        (a, b) =>
          new Date(b?.lessonDate || 0).getTime() -
          new Date(a?.lessonDate || 0).getTime(),
      );
  }, [selectedGroup, selectedGroupContent]);

  const selectedLesson = useMemo(
    () =>
      lessonRows.find((row) => Number(row.id) === Number(selectedLessonId)) ||
      null,
    [lessonRows, selectedLessonId],
  );

  const selectedHomework =
    selectedLesson && Array.isArray(selectedLesson.homeworks)
      ? selectedLesson.homeworks[0] || null
      : null;

  useEffect(() => {
    if (!selectedHomework?.id) return;

    const key = String(selectedHomework.id);
    if (key in myResponses) {
      setSubmissionTitle(myResponses[key]?.title || "");
      return;
    }

    const loadMyResponse = async () => {
      try {
        const result = await homeworkResponseApi.getMine(selectedHomework.id);
        const data = result?.data || null;
        setMyResponses((prev) => ({
          ...prev,
          [key]: data,
        }));
        setSubmissionTitle(data?.title || "");
      } catch {
        setMyResponses((prev) => ({
          ...prev,
          [key]: null,
        }));
        setSubmissionTitle("");
      }
    };

    loadMyResponse();
  }, [selectedHomework, myResponses]);

  const handleSubmitHomeworkResponse = async () => {
    if (!selectedHomework?.id) return;

    const title = String(submissionTitle || "").trim();
    if (!title) {
      alert("Javob matni majburiy");
      return;
    }

    // Check if homework deadline has passed
    const deadline = getHomeworkDeadline(selectedHomework);
    if (deadline && new Date() > deadline) {
      alert("Uyga vazifaning vaqti tugagan. Yuborolmaysiz!");
      return;
    }

    const payload = {
      homeworkId: selectedHomework.id,
      title,
      ...(submissionFile ? { file: submissionFile } : {}),
    };

    try {
      setSubmissionSaving(true);
      const current = myResponses[String(selectedHomework.id)];
      if (current?.id) {
        await homeworkResponseApi.update(payload);
      } else {
        await homeworkResponseApi.create(payload);
      }

      const result = await homeworkResponseApi.getMine(selectedHomework.id);
      setMyResponses((prev) => ({
        ...prev,
        [String(selectedHomework.id)]: result?.data || null,
      }));

      setSubmissionFile(null);
      setSubmissionTitle("");
      setShowDashboard(true);
    } catch (error) {
      alert(error?.response?.data?.message || "Javobni saqlashda xato");
    } finally {
      setSubmissionSaving(false);
    }
  };

  const filteredLessonRows = useMemo(() => {
    if (homeworkStatusFilter === "ALL") return lessonRows;
    return lessonRows.filter((row) => row.status === homeworkStatusFilter);
  }, [lessonRows, homeworkStatusFilter]);

  useEffect(() => {
    if (!selectedGroup?.id) return;
    if (filteredLessonRows.length === 0) {
      setSelectedLessonId(null);
      return;
    }

    const exists = filteredLessonRows.some(
      (row) => Number(row.id) === Number(selectedLessonId),
    );

    if (!exists) {
      setSelectedLessonId(filteredLessonRows[0].id);
    }
  }, [filteredLessonRows, selectedGroup, selectedLessonId]);

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
    <div className="relative">
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
          {!selectedGroup ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-6 border-b border-slate-200 sm:border-b-0">
                  {tabs.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={`pb-3 sm:pb-0 text-base font-medium border-b-2 sm:border-b-0 sm:rounded-lg sm:px-3 sm:py-2 transition ${
                        activeTab === tab.key
                          ? "text-amber-700 border-amber-600 sm:bg-amber-50"
                          : "text-slate-500 border-transparent hover:text-slate-700"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Guruh qidirish..."
                  className="w-full sm:w-64 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-amber-500"
                />
              </div>

              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-190 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-3 text-left font-semibold text-slate-600">
                        #
                      </th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-600">
                        Guruh nomi
                      </th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-600">
                        Yo'nalishi
                      </th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-600">
                        O'qituvchi
                      </th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-600">
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
                          {activeTab === "ACTIVE"
                            ? "Faol guruhlar topilmadi"
                            : "Tugagan guruhlar topilmadi"}
                        </td>
                      </tr>
                    )}

                    {filteredGroups.map((group, index) => (
                      <tr
                        key={group.id}
                        onClick={() => {
                          setSelectedGroup(group);
                          setSelectedLessonId(null);
                          setHomeworkStatusFilter("ALL");
                        }}
                        className="border-t border-slate-200 hover:bg-slate-50 cursor-pointer"
                      >
                        <td className="px-3 py-3 text-slate-700">
                          {index + 1}
                        </td>
                        <td className="px-3 py-3 font-medium text-slate-900">
                          {group?.name || "-"}
                        </td>
                        <td className="px-3 py-3 text-slate-700">
                          {group?.course?.name || "-"}
                        </td>
                        <td className="px-3 py-3 text-slate-700">
                          {group?.teacher?.fullName ||
                            group?.teacher?.name ||
                            "-"}
                        </td>
                        <td className="px-3 py-3 text-slate-700">
                          {formatDate(group?.startDate)}
                        </td>
                      </tr>
                    ))}
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
                    onClick={() => {
                      setSelectedGroup(null);
                      setSelectedLessonId(null);
                      setSubmissionTitle("");
                      setSubmissionFile(null);
                    }}
                    className="mb-2 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    ← Guruhlarga qaytish
                  </button>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {selectedGroup?.name || "Guruh darslari"}
                  </h2>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4 sm:p-6">
                <div className="max-w-xs">
                  <label
                    htmlFor="homework-status"
                    className="mb-2 block text-sm font-medium text-slate-600"
                  >
                    Uy vazifa statusi
                  </label>
                  <select
                    id="homework-status"
                    value={homeworkStatusFilter}
                    onChange={(e) => setHomeworkStatusFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-800 outline-none focus:border-amber-500"
                  >
                    <option value="ALL">Barchasi</option>
                    <option value="ASSIGNED">Berilgan</option>
                    <option value="NOT_ASSIGNED">Berilmagan</option>
                    <option value="EXAM">Imtihon</option>
                  </select>
                </div>

                <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                  <table className="w-full min-w-237.5 text-base table-fixed">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="w-[32%] px-4 py-5 text-left font-semibold text-slate-900">
                          Mavzular
                        </th>
                        <th className="w-24 px-4 py-5 text-left font-semibold text-slate-900">
                          Video
                        </th>
                        <th className="w-58 px-4 py-5 text-left font-semibold text-slate-900">
                          Uyga vazifa Holati
                        </th>
                        <th className="w-62 px-4 py-5 text-left font-semibold text-slate-900">
                          Uyga vazifa tugash vaqti ↓
                        </th>
                        <th className="w-48 px-4 py-5 text-left font-semibold text-slate-900">
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
                            onClick={() => {
                              setSelectedLessonDetail(row);
                            }}
                            className="border-b border-slate-200 last:border-b-0 cursor-pointer hover:bg-slate-50"
                          >
                            <td className="px-4 py-5 text-slate-900 wrap-break-word">
                              {row.topic}
                            </td>
                            <td className="px-4 py-5">
                              <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-sky-400 px-3 text-sky-500">
                                {row.videoCount}
                              </span>
                            </td>
                            <td className="px-4 py-5">
                              {statusBadge(row.status)}
                            </td>
                            <td className="px-4 py-5 text-slate-900 whitespace-nowrap">
                              {formatDateTime(row.deadline)}
                            </td>
                            <td className="px-4 py-5 text-slate-900 whitespace-nowrap">
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
      </div>

      {/* Modals - Rendered outside main content for proper z-index */}
      {/* Lesson Detail Modal */}
      {selectedLessonDetail && (
        <LessonDetailPage
          lesson={selectedLessonDetail}
          onBack={() => {
            setSelectedLessonDetail(null);
            setShowDashboard(true);
          }}
          userRole="student"
        />
      )}

      {/* Student Dashboard Modal */}
      {showDashboard && (
        <StudentDashboard onClose={() => setShowDashboard(false)} />
      )}
    </div>
  );
}
