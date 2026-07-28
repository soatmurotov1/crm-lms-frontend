import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import GroupsPage from "../AdminPages/GroupsPage";
import GroupDetailsPage from "../AdminPages/GroupDetrailsPage";
import ExamsPage from "../AdminPages/ExamsPage";
import TeacherSettings from "./TeacherSettings";
import PanelLayout from "../../components/layout/PanelLayout";
import Card from "../../components/ui/Card";
import ChartFallback from "../../components/ui/ChartFallback";
import ListCard from "../../components/ui/ListCard";
import PlaceholderSection from "../../components/ui/PlaceholderSection";
import NotificationsSection from "../../components/notifications/NotificationsSection";
import GradesSection from "../../components/grades/GradesSection";
import SectionHeader from "../../components/ui/SectionHeader";
import StatCard from "../../components/ui/StatCard";
import { getAuthUserFromStorage } from "../../utils/authToken";
import { useTheme } from "../../theme/themeContext";
import { attendanceApi, groupsApi, homeworkApi } from "../../api/crmApi";
import StudentHome from "../StudentPages/components/StudentHome";
import "../StudentPages/StudentDashboard.css";
import {
  DAY_INDEX_TO_ENUM,
  WEEK_DAYS,
  formatMonthLabel,
  formatShortDate,
} from "../StudentPages/studentDashboardUtils";

const AttendanceBars = lazy(
  () => import("../../components/charts/AttendanceBars"),
);
const DonutChart = lazy(() => import("../../components/charts/DonutChart"));

const MENU_ITEMS = [
  {
    key: "dashboard",
    label: "Boshqaruv paneli",
    shortLabel: "Asosiy",
    icon: "🏠",
  },
  {
    key: "groups",
    label: "Mening guruhlarim",
    shortLabel: "Guruhlar",
    icon: "📚",
  },
  { key: "schedule", label: "Dars jadvali", shortLabel: "Jadval", icon: "🗓️" },
  { key: "attendance", label: "Davomat", icon: "✅" },
  { key: "grades", label: "Baholar", icon: "⭐" },
  { key: "homework", label: "Uy vazifalar", icon: "📝" },
  { key: "exams", label: "Testlar", icon: "🧪" },
  { key: "students", label: "O'quvchilar", icon: "🎓" },
  { key: "notifications", label: "Xabarnomalar", icon: "🔔" },
  { key: "settings", label: "Sozlamalar", icon: "⚙️" },
];

const MENU_PATHS = {
  dashboard: "/teacher",
  groups: "/teacher/groups",
  schedule: "/teacher/schedule",
  attendance: "/teacher/attendance",
  grades: "/teacher/grades",
  homework: "/teacher/homework",
  exams: "/teacher/exams",
  students: "/teacher/students",
  notifications: "/teacher/notifications",
  settings: "/teacher/settings",
};

// Eski route'lardagi "home" kaliti yangi "dashboard"ga moslanadi.
const LEGACY_MENU_MAP = { home: "dashboard" };

const buildCalendarDays = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const leadingEmpty = (firstDay.getDay() + 6) % 7;
  const days = [];

  for (let i = 0; i < leadingEmpty; i += 1) {
    days.push(null);
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(new Date(year, month, day));
  }

  return days;
};

const normalizeWeekDays = (value) => {
  const normalizeItem = (item) => {
    const normalized = String(item || "")
      .trim()
      .toUpperCase();
    return DAY_INDEX_TO_ENUM.includes(normalized) ? normalized : null;
  };

  if (Array.isArray(value)) {
    return value.map(normalizeItem).filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.map(normalizeItem).filter(Boolean)
        : [];
    } catch {
      return value
        .replace(/[{}]/g, "")
        .split(",")
        .map((item) => item.trim().replace(/^"|"$/g, ""))
        .map(normalizeItem)
        .filter(Boolean);
    }
  }
  return [];
};

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isSameDay = (first, second) =>
  first?.getFullYear() === second?.getFullYear() &&
  first?.getMonth() === second?.getMonth() &&
  first?.getDate() === second?.getDate();

const startOfDay = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const parseDate = (value, fallback) => {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed;
};

const toEndTime = (startTime, durationMinutes) => {
  if (!startTime || !durationMinutes) return "-";

  const [hour = 0, minute = 0] = String(startTime)
    .split(":")
    .map((part) => Number(part));
  const endMinutes = hour * 60 + minute + Number(durationMinutes || 0);

  return `${String(Math.floor(endMinutes / 60) % 24).padStart(2, "0")}:${String(
    endMinutes % 60,
  ).padStart(2, "0")}`;
};

export default function TeacherDashboard({ initialMenu = "dashboard" }) {
  const navigate = useNavigate();
  const { darkMode, theme } = useTheme();

  const [activeMenu, setActiveMenu] = useState(
    () => LEGACY_MENU_MAP[initialMenu] || initialMenu,
  );
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupDetailsKey, setGroupDetailsKey] = useState(0);
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState("");

  const [studentsByGroup, setStudentsByGroup] = useState({});
  const [homeworkByGroup, setHomeworkByGroup] = useState({});
  const [attendanceDays, setAttendanceDays] = useState([]);
  const [topStudents, setTopStudents] = useState([]);

  const [calendarMonth, setCalendarMonth] = useState(() =>
    parseDate(null, new Date()),
  );
  const [selectedDate, setSelectedDate] = useState(() =>
    parseDate(null, new Date()),
  );

  const authUser = useMemo(() => getAuthUserFromStorage(), []);
  const teacherName = authUser?.fullName || authUser?.phone || "O'qituvchi";

  useEffect(() => {
    setActiveMenu(LEGACY_MENU_MAP[initialMenu] || initialMenu);
    if (initialMenu !== "groups") setSelectedGroup(null);
  }, [initialMenu]);

  useEffect(() => {
    let isMounted = true;

    const loadGroups = async () => {
      setIsLoading(true);
      setDataError("");
      try {
        const result = await groupsApi.getAll("ALL");
        if (!isMounted) return;
        setGroups(Array.isArray(result?.data) ? result.data : []);
      } catch {
        if (isMounted) {
          setGroups([]);
          setDataError("Ma'lumotlarni yuklab bo'lmadi");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadGroups();
    return () => {
      isMounted = false;
    };
  }, []);

  // Guruhlar kelgach: o'quvchilar, uy vazifalar va davomat statistikasi.
  useEffect(() => {
    if (groups.length === 0) return undefined;
    let isMounted = true;

    const loadGroupDetails = async () => {
      const [studentResults, homeworkResults, weeklyResults] =
        await Promise.all([
          Promise.allSettled(
            groups.map((group) => groupsApi.getStudentsByGroup(group.id)),
          ),
          Promise.allSettled(
            groups.map((group) => homeworkApi.getByGroup(group.id)),
          ),
          Promise.allSettled(
            groups.map((group) =>
              attendanceApi.getWeeklyStats({ groupId: group.id }),
            ),
          ),
        ]);

      if (!isMounted) return;

      const nextStudents = {};
      const nextHomework = {};
      groups.forEach((group, index) => {
        const studentResult = studentResults[index];
        nextStudents[group.id] =
          studentResult?.status === "fulfilled" &&
          Array.isArray(studentResult.value?.data)
            ? studentResult.value.data
            : [];

        const homeworkResult = homeworkResults[index];
        nextHomework[group.id] =
          homeworkResult?.status === "fulfilled" &&
          Array.isArray(homeworkResult.value?.data)
            ? homeworkResult.value.data
            : [];
      });

      setStudentsByGroup(nextStudents);
      setHomeworkByGroup(nextHomework);

      // Har bir guruhning haftalik davomati bitta jadvalga yig'iladi.
      const merged = new Map();
      weeklyResults.forEach((result) => {
        if (result?.status !== "fulfilled") return;
        const days = Array.isArray(result.value?.data) ? result.value.data : [];

        days.forEach((day) => {
          const current = merged.get(day.weekday) || {
            day: day.day,
            weekday: day.weekday,
            present: 0,
            total: 0,
            percent: 0,
          };
          current.present += Number(day.present || 0);
          current.total += Number(day.total || 0);
          merged.set(day.weekday, current);
        });
      });

      const orderedDays = Array.from(merged.values())
        .map((day) => ({
          ...day,
          percent: day.total ? Math.round((day.present / day.total) * 100) : 0,
        }))
        .sort((a, b) => ((a.weekday + 6) % 7) - ((b.weekday + 6) % 7));

      setAttendanceDays(orderedDays);
    };

    loadGroupDetails();
    return () => {
      isMounted = false;
    };
  }, [groups]);

  // "Top o'quvchilar" — oxirgi darslardagi davomat bo'yicha reyting.
  useEffect(() => {
    if (groups.length === 0) return undefined;
    let isMounted = true;

    const loadTopStudents = async () => {
      const lessonResults = await Promise.allSettled(
        groups.map((group) => groupsApi.getLessonsByGroup(group.id)),
      );

      const lessons = [];
      lessonResults.forEach((result) => {
        if (result?.status !== "fulfilled") return;
        const list = Array.isArray(result.value?.data) ? result.value.data : [];
        lessons.push(...list);
      });

      const recentLessons = lessons
        .sort(
          (a, b) =>
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime(),
        )
        .slice(0, 6);

      if (recentLessons.length === 0) {
        if (isMounted) setTopStudents([]);
        return;
      }

      const attendanceResults = await Promise.allSettled(
        recentLessons.map((lesson) => attendanceApi.getByLesson(lesson.id)),
      );

      if (!isMounted) return;

      const scores = new Map();
      attendanceResults.forEach((result) => {
        if (result?.status !== "fulfilled") return;
        const rows = Array.isArray(result.value?.data) ? result.value.data : [];

        rows.forEach((row) => {
          const student = row?.student;
          if (!student?.id) return;

          const current = scores.get(student.id) || {
            id: student.id,
            name: student.fullName,
            present: 0,
            total: 0,
          };
          current.total += 1;
          if (row.isPresent) current.present += 1;
          scores.set(student.id, current);
        });
      });

      setTopStudents(
        Array.from(scores.values())
          .map((item) => ({
            ...item,
            percent: item.total
              ? Math.round((item.present / item.total) * 100)
              : 0,
          }))
          .sort((a, b) => b.percent - a.percent || b.present - a.present)
          .slice(0, 5),
      );
    };

    loadTopStudents();
    return () => {
      isMounted = false;
    };
  }, [groups]);

  const monthLabel = useMemo(
    () => formatMonthLabel(calendarMonth),
    [calendarMonth],
  );

  const calendarDays = useMemo(
    () => buildCalendarDays(calendarMonth),
    [calendarMonth],
  );

  const today = useMemo(() => new Date(), []);

  const lessonsByDate = useMemo(() => {
    const map = {};
    calendarDays.forEach((date) => {
      if (!date) return;
      const dateKey = toDateKey(date);
      const dayEnum = DAY_INDEX_TO_ENUM[date.getDay()];
      groups.forEach((group) => {
        const weekDays = normalizeWeekDays(group.weekDays);
        if (!weekDays.includes(dayEnum)) return;
        const startDate = startOfDay(group.startDate);
        if (startDate && date < startDate) return;

        const lessons = map[dateKey] || [];
        lessons.push({
          id: `${group.id}-${dateKey}`,
          title: group.name || group.course?.name || "Dars",
          time: group.startTime || "-",
          room: group.room?.name || group.room?.title || group.roomName || "-",
        });
        map[dateKey] = lessons;
      });
    });
    return map;
  }, [calendarDays, groups]);

  const calendarCells = useMemo(
    () =>
      calendarDays.map((date, index) => {
        if (!date) {
          return { key: `empty-${index}`, isEmpty: true };
        }

        const dateKey = toDateKey(date);
        const isToday = isSameDay(date, today);
        const isSelected = isSameDay(date, selectedDate);
        const hasLesson = Boolean(lessonsByDate[dateKey]);
        const className = [
          "cal-day",
          isToday ? "today" : "",
          isSelected ? "selected" : "",
          hasLesson ? "has-lesson" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return {
          key: dateKey,
          isEmpty: false,
          date,
          label: date.getDate(),
          className,
        };
      }),
    [calendarDays, lessonsByDate, selectedDate, today],
  );

  const selectedLessons = useMemo(() => {
    const key = toDateKey(selectedDate);
    return lessonsByDate[key] || [];
  }, [lessonsByDate, selectedDate]);

  const lessonTitle = useMemo(() => {
    if (isSameDay(selectedDate, today)) return "Bugungi darslar";
    return `${formatShortDate(selectedDate)} darslari`;
  }, [selectedDate, today]);

  const changeMonth = (offset) => {
    setCalendarMonth((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + offset, 1);
      setSelectedDate(new Date(next.getFullYear(), next.getMonth(), 1));
      return next;
    });
  };

  const todayLessons = useMemo(() => {
    const todayEnum = DAY_INDEX_TO_ENUM[new Date().getDay()];

    return groups
      .filter((group) => normalizeWeekDays(group.weekDays).includes(todayEnum))
      .map((group) => ({
        id: group.id,
        title: group.name || "-",
        meta: `${group.startTime || "-"} - ${toEndTime(
          group.startTime,
          group.course?.durationLesson,
        )} · ${group.room?.name || "Xona belgilanmagan"}`,
        badge: "Bugun",
        tone: "emerald",
        icon: "🕘",
        group,
      }))
      .sort((a, b) => String(a.meta).localeCompare(String(b.meta)));
  }, [groups]);

  const uniqueStudents = useMemo(() => {
    const map = new Map();
    Object.values(studentsByGroup).forEach((list) => {
      list.forEach((student) => map.set(student.id, student));
    });
    return Array.from(map.values());
  }, [studentsByGroup]);

  const attendanceTotals = useMemo(() => {
    const present = attendanceDays.reduce(
      (sum, day) => sum + Number(day.present || 0),
      0,
    );
    const total = attendanceDays.reduce(
      (sum, day) => sum + Number(day.total || 0),
      0,
    );

    return {
      present,
      absent: Math.max(total - present, 0),
      total,
      percent: total ? Math.round((present / total) * 100) : 0,
    };
  }, [attendanceDays]);

  const allHomework = useMemo(() => {
    const rows = [];
    groups.forEach((group) => {
      (homeworkByGroup[group.id] || []).forEach((homework) => {
        rows.push({ ...homework, groupId: group.id, groupName: group.name });
      });
    });

    return rows.sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime(),
    );
  }, [groups, homeworkByGroup]);

  const homeworkActivity = useMemo(() => {
    let responses = 0;
    let reviewed = 0;

    allHomework.forEach((homework) => {
      responses += Number(homework?._count?.homeworkResponses || 0);
      reviewed += Number(homework?._count?.homeworkResults || 0);
    });

    const expected = allHomework.length * uniqueStudents.length;

    return {
      responses,
      reviewed,
      missing: Math.max(expected - responses, 0),
    };
  }, [allHomework, uniqueStudents.length]);

  const openMenu = (menuKey) => {
    setSelectedGroup(null);
    setActiveMenu(menuKey);
    navigate(MENU_PATHS[menuKey] || "/teacher");
  };

  const handleLogout = () => {
    localStorage.removeItem("crm_access_token");
    navigate("/", { replace: true });
  };

  const openGroupDetails = (group, menuKey = "groups") => {
    const nextGroup = group ? { ...group } : null;
    const nextTab = nextGroup?.initialMainTab || "guruh-darsliklari";
    setSelectedGroup(nextGroup);
    setGroupDetailsKey((prev) => prev + 1);
    setActiveMenu(menuKey);

    if (nextGroup?.id) {
      const params = new URLSearchParams();
      params.set("groupId", String(nextGroup.id));
      params.set("tab", nextTab);
      navigate(`${MENU_PATHS[menuKey] || "/teacher/groups"}?${params}`);
    }
  };

  const handleGroupBack = () => {
    setSelectedGroup(null);
    navigate(MENU_PATHS[activeMenu] || "/teacher/groups");
  };

  const handleGroupTabChange = (tabKey) => {
    if (!selectedGroup?.id) return;
    const params = new URLSearchParams();
    params.set("groupId", String(selectedGroup.id));
    params.set("tab", tabKey);
    navigate(`${MENU_PATHS[activeMenu] || "/teacher/groups"}?${params}`, {
      replace: true,
    });
  };

  const renderGroupDetails = () => (
    <GroupDetailsPage
      key={groupDetailsKey}
      theme={theme}
      darkMode={darkMode}
      group={selectedGroup}
      onBack={handleGroupBack}
      onTabChange={handleGroupTabChange}
      readOnly
      allowAttendanceEdit
      allowHomeworkDetailView
      allowHomeworkUpload
      allowVideoUpload
      allowVideoDelete
    />
  );

  const renderOverview = () => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatCard
          icon="📚"
          tone="violet"
          label="Mening guruhlarim"
          value={isLoading ? "..." : groups.length}
        />
        <StatCard
          icon="🕘"
          tone="blue"
          label="Bugungi darslar"
          value={isLoading ? "..." : todayLessons.length}
        />
        <StatCard
          icon="🎓"
          tone="emerald"
          label="Jami o'quvchilar"
          value={uniqueStudents.length}
        />
        <StatCard
          icon="✅"
          tone="amber"
          label="O'rtacha davomat"
          value={`${attendanceTotals.percent}%`}
          deltaLabel={
            attendanceTotals.total
              ? `${attendanceTotals.present} / ${attendanceTotals.total} belgilangan`
              : "Oxirgi 7 kunda davomat yo'q"
          }
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3 mb-5">
        <ListCard
          title="Bugungi dars jadvali"
          subtitle={formatShortDate(new Date())}
          items={todayLessons.map((lesson) => ({
            ...lesson,
            onClick: () => openGroupDetails(lesson.group),
          }))}
          loading={isLoading}
          emptyText="Bugun dars yo'q"
          maxHeight={300}
        />

        <Card>
          <SectionHeader title="Davomat" subtitle="Oxirgi 7 kun" />

          <Suspense fallback={<ChartFallback height={200} />}>
            <DonutChart
              height={200}
              slices={[
                {
                  name: "Keldi",
                  value: attendanceTotals.present,
                  color: "#10b981",
                },
                {
                  name: "Kelmadi",
                  value: attendanceTotals.absent,
                  color: "#f43f5e",
                },
                { name: "Kechikdi", value: 0, color: "#f59e0b" },
              ]}
              centerValue={`${attendanceTotals.percent}%`}
              centerLabel="davomat"
              formatValue={(value) => `${value} ta`}
              emptyText="Davomat belgilanmagan"
            />
          </Suspense>

          <button
            onClick={() => openMenu("attendance")}
            className="mt-5 w-full rounded-xl bg-violet-600 hover:bg-violet-700 text-white py-2.5 text-sm font-medium"
          >
            Davomat belgilash
          </button>
        </Card>

        <ListCard
          title="Top o'quvchilar"
          subtitle="Oxirgi darslardagi davomat bo'yicha"
          items={topStudents.map((student, index) => ({
            id: student.id,
            title: `${index + 1}. ${student.name}`,
            meta: `${student.present} / ${student.total} darsda qatnashgan`,
            badge: `${student.percent}%`,
            tone: index === 0 ? "amber" : "violet",
            icon: index === 0 ? "🏆" : "🎓",
          }))}
          emptyText="Davomat ma'lumoti yetarli emas"
          maxHeight={300}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ListCard
          title="Uy vazifalar"
          subtitle="Oxirgi berilgan vazifalar"
          items={allHomework.slice(0, 6).map((homework) => ({
            id: homework.id,
            title: homework.title || "Uy vazifa",
            meta: `${homework.groupName} · ${
              homework?._count?.homeworkResponses || 0
            } ta javob`,
            badge: `${homework?._count?.homeworkResults || 0} tekshirilgan`,
            tone: "violet",
            icon: "📝",
          }))}
          emptyText="Uy vazifa berilmagan"
          maxHeight={320}
        />

        <Card>
          <SectionHeader
            title="O'quvchilar faoliyati statistikasi"
            subtitle="Uy vazifalarga javob berish holati"
          />
          <Suspense fallback={<ChartFallback height={200} />}>
            <DonutChart
              height={200}
              slices={[
                {
                  name: "Javob berilgan",
                  value: homeworkActivity.responses,
                  color: "#8b5cf6",
                },
                {
                  name: "Tekshirilgan",
                  value: homeworkActivity.reviewed,
                  color: "#10b981",
                },
                {
                  name: "Topshirilmagan",
                  value: homeworkActivity.missing,
                  color: "#f43f5e",
                },
              ]}
              formatValue={(value) => `${value} ta`}
              emptyText="Uy vazifa faoliyati yo'q"
            />
          </Suspense>
        </Card>
      </div>
    </>
  );

  const renderContent = () => {
    if (activeMenu === "dashboard") return renderOverview();

    if (activeMenu === "schedule") {
      return (
        <StudentHome
          monthLabel={monthLabel}
          weekDays={WEEK_DAYS}
          calendarCells={calendarCells}
          onSelectDate={setSelectedDate}
          onChangeMonth={changeMonth}
          lessonTitle={lessonTitle}
          selectedLessons={selectedLessons}
          isLoading={isLoading}
          darkMode={darkMode}
        />
      );
    }

    if (activeMenu === "settings") {
      return <TeacherSettings darkMode={darkMode} />;
    }

    if (activeMenu === "exams") return <ExamsPage />;

    if (activeMenu === "attendance") {
      if (selectedGroup) return renderGroupDetails();

      return (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <StatCard
              icon="✅"
              tone="emerald"
              label="O'rtacha davomat"
              value={`${attendanceTotals.percent}%`}
            />
            <StatCard
              icon="🎓"
              tone="violet"
              label="Kelganlar"
              value={attendanceTotals.present}
            />
            <StatCard
              icon="🚫"
              tone="rose"
              label="Kelmaganlar"
              value={attendanceTotals.absent}
            />
          </div>

          <Card>
            <SectionHeader
              title="Davomat statistikasi"
              subtitle="Oxirgi 7 kun, mening guruhlarim"
            />
            <Suspense fallback={<ChartFallback height={260} />}>
              <AttendanceBars days={attendanceDays} />
            </Suspense>
          </Card>

          <ListCard
            title="Guruhni tanlang"
            subtitle="Davomat belgilash uchun guruh ustiga bosing"
            items={groups.map((group) => ({
              id: group.id,
              title: group.name || "-",
              meta: `${(studentsByGroup[group.id] || []).length} o'quvchi · ${
                group.course?.name || "Kurs belgilanmagan"
              }`,
              badge: "Davomat",
              tone: "emerald",
              icon: "📋",
              onClick: () =>
                openGroupDetails(
                  { ...group, initialMainTab: "akademik-davomat" },
                  "attendance",
                ),
            }))}
            loading={isLoading}
            emptyText="Guruh topilmadi"
          />
        </div>
      );
    }

    if (activeMenu === "homework") {
      if (selectedGroup) return renderGroupDetails();

      return (
        <ListCard
          title="Uy vazifalar"
          subtitle="Guruh bo'yicha berilgan vazifalar"
          items={allHomework.map((homework) => {
            const group = groups.find((item) => item.id === homework.groupId);

            return {
              id: homework.id,
              title: homework.title || "Uy vazifa",
              meta: `${homework.groupName} · ${
                homework?._count?.homeworkResponses || 0
              } ta javob · ${homework?._count?.homeworkResults || 0} tekshirilgan`,
              badge: homework.lesson?.title || "Dars",
              tone: "violet",
              icon: "📝",
              onClick: group
                ? () => openGroupDetails(group, "homework")
                : undefined,
            };
          })}
          loading={isLoading}
          emptyText="Uy vazifa berilmagan"
        />
      );
    }

    if (activeMenu === "grades") {
      if (selectedGroup) return renderGroupDetails();

      return (
        <div className="space-y-5">
          <ListCard
            title="Baholar (guruhlar kesimida)"
            subtitle="Tekshirilgan uy vazifalar soni bo'yicha"
            items={groups.map((group) => {
              const homeworks = homeworkByGroup[group.id] || [];
              const reviewed = homeworks.reduce(
                (sum, homework) =>
                  sum + Number(homework?._count?.homeworkResults || 0),
                0,
              );
              const responses = homeworks.reduce(
                (sum, homework) =>
                  sum + Number(homework?._count?.homeworkResponses || 0),
                0,
              );

              return {
                id: group.id,
                title: group.name || "-",
                meta: `${homeworks.length} vazifa · ${responses} javob · ${reviewed} baholangan`,
                badge: "Ochish",
                tone: "violet",
                icon: "⭐",
                onClick: () => openGroupDetails(group, "grades"),
              };
            })}
            loading={isLoading}
            emptyText="Guruh topilmadi"
          />

          <GradesSection groups={groups} loading={isLoading} />
        </div>
      );
    }

    if (activeMenu === "students") {
      return (
        <ListCard
          title="O'quvchilar"
          subtitle="Mening guruhlarimdagi barcha o'quvchilar"
          items={uniqueStudents.map((student) => {
            const studentGroups = groups
              .filter((group) =>
                (studentsByGroup[group.id] || []).some(
                  (item) => item.id === student.id,
                ),
              )
              .map((group) => group.name)
              .join(", ");

            return {
              id: student.id,
              title: student.fullName,
              meta: `${student.phone || "Telefon yo'q"}${
                studentGroups ? ` · ${studentGroups}` : ""
              }`,
              tone: "violet",
              icon: "🎓",
            };
          })}
          loading={isLoading}
          emptyText="O'quvchi topilmadi"
        />
      );
    }

    if (activeMenu === "notifications") {
      return (
        <NotificationsSection
          canSend
          groupOnly
          groups={groups}
          subtitle="Guruhlaringizga xabar yuborish va sizga kelgan xabarlar"
        />
      );
    }

    if (selectedGroup) return renderGroupDetails();

    return (
      <GroupsPage
        theme={theme}
        darkMode={darkMode}
        currentUser={authUser}
        onOpenGroupDetails={openGroupDetails}
      />
    );
  };

  return (
    <PanelLayout
      brand="EduCenter"
      menuItems={MENU_ITEMS}
      activeKey={activeMenu}
      onSelect={openMenu}
      greeting={`Xush kelibsiz, ${teacherName}`}
      subtitle={MENU_ITEMS.find((item) => item.key === activeMenu)?.label}
      user={authUser}
      roleLabel="TEACHER"
      onLogout={handleLogout}
    >
      {dataError && (
        <div
          className={`mb-5 rounded-2xl border p-4 text-sm ${theme.rowBorder} ${theme.soft}`}
        >
          {dataError}
        </div>
      )}
      {renderContent()}
    </PanelLayout>
  );
}
