import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import GroupsPage from "../AdminPages/GroupsPage";
import GroupDetailsPage from "../AdminPages/GroupDetrailsPage";
import TeacherSettings from "./TeacherSettings";
import { getAuthUserFromStorage } from "../../utils/authToken";
import { groupsApi } from "../../api/crmApi";
import StudentHome from "../StudentPages/components/StudentHome";
import "../StudentPages/StudentDashboard.css";
import {
  DAY_INDEX_TO_ENUM,
  WEEK_DAYS,
  formatMonthLabel,
  formatShortDate,
} from "../StudentPages/studentDashboardUtils";

const menuItems = [
  { id: 1, key: "home", icon: "🏠" },
  { id: 2, key: "groups", icon: "📚" },
  { id: 3, key: "settings", icon: "⚙️" },
];

const translations = {
  uz: {
    brand: "Najot Talim",
    greeting: "Salom",
    logout: "Chiqish",
    home: "Bosh sahifa",
    groups: "Guruhlar",
    settings: "Sozlamalar",
  },
  en: {
    brand: "Najot Talim",
    greeting: "Hello",
    logout: "Logout",
    home: "Home",
    groups: "Groups",
    settings: "Settings",
  },
  ru: {
    brand: "Najot Talim",
    greeting: "Здравствуйте",
    logout: "Выйти",
    home: "Главная",
    groups: "Группы",
    settings: "Настройки",
  },
};

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

export default function TeacherDashboard({ initialMenu = "home" }) {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState(initialMenu);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupDetailsKey, setGroupDetailsKey] = useState(0);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("uz");
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() =>
    parseDate(null, new Date()),
  );
  const [selectedDate, setSelectedDate] = useState(() =>
    parseDate(null, new Date()),
  );

  const profileButtonRef = useRef(null);
  const profilePanelRef = useRef(null);

  const t = translations[language] || translations.uz;
  const authUser = useMemo(() => getAuthUserFromStorage(), []);
  const greetingName =
    authUser?.fullName || authUser?.email?.split("@")[0] || "Foydalanuvchi";
  const greetingText = `${t.greeting}, ${greetingName}!`;
  const profileName = greetingName;
  const profileInitial = String(profileName).trim().charAt(0).toUpperCase();

  const theme = darkMode
    ? {
        app: "bg-slate-950",
        sidebar: "bg-slate-900 border-slate-800",
        main: "bg-slate-950",
        card: "bg-slate-900 border-slate-800",
        text: "text-white",
        soft: "text-slate-400",
        menu: "text-slate-200",
        hover: "hover:bg-slate-800",
        topBtn: "bg-slate-900 border-slate-700 text-white",
        active: "bg-violet-600 text-white",
        select: "bg-slate-900 border-slate-700 text-white",
        rowBorder: "border-slate-700",
        tab: "bg-slate-900 text-slate-300 border-slate-700",
        tabActive: "bg-violet-600 text-white border-violet-600",
      }
    : {
        app: "bg-slate-100",
        sidebar: "bg-white border-slate-200",
        main: "bg-slate-100",
        card: "bg-white border-slate-200",
        text: "text-slate-900",
        soft: "text-slate-500",
        menu: "text-slate-700",
        hover: "hover:bg-slate-100",
        topBtn: "bg-white border-slate-200 text-slate-700",
        active: "bg-violet-500 text-white",
        select: "bg-white border-slate-200 text-slate-700",
        rowBorder: "border-slate-200",
        tab: "bg-white text-slate-600 border-slate-200",
        tabActive: "bg-violet-100 text-violet-700 border-violet-200",
      };

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

  const menuPathMap = {
    home: "/teacher/home",
    groups: "/teacher/groups",
    settings: "/teacher/settings",
  };

  const openMenu = (menuKey) => {
    setSelectedGroup(null);
    setActiveMenu(menuKey);
    navigate(menuPathMap[menuKey] || "/teacher/home");
  };

  const handleLogout = () => {
    localStorage.removeItem("crm_access_token");
    setShowProfilePanel(false);
    navigate("/", { replace: true });
  };

  const openGroupDetails = (group) => {
    const nextGroup = group ? { ...group } : null;
    const nextTab = nextGroup?.initialMainTab || "guruh-darsliklari";
    setSelectedGroup(nextGroup);
    setGroupDetailsKey((prev) => prev + 1);
    setActiveMenu("groups");
    if (nextGroup?.id) {
      const params = new URLSearchParams();
      params.set("groupId", String(nextGroup.id));
      params.set("tab", nextTab);
      navigate(`/teacher/groups?${params.toString()}`);
    }
  };

  const handleGroupBack = () => {
    setSelectedGroup(null);
    navigate("/teacher/groups");
  };

  const handleGroupTabChange = (tabKey) => {
    if (!selectedGroup?.id) return;
    const params = new URLSearchParams();
    params.set("groupId", String(selectedGroup.id));
    params.set("tab", tabKey);
    navigate(`/teacher/groups?${params.toString()}`, { replace: true });
  };

  const renderContent = () => {
    if (dataError) {
      return <div className="no-lesson">{dataError}</div>;
    }

    if (activeMenu === "home") {
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

    if (selectedGroup) {
      return (
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
    }

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
    <div className={`min-h-screen flex ${theme.app}`}>
      <aside
        className={`relative w-60 border-r p-4 flex flex-col ${theme.sidebar}`}
      >
        <h1 className="text-2xl font-bold text-violet-600 mb-8">{t.brand}</h1>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => openMenu(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition cursor-pointer ${
                activeMenu === item.key
                  ? theme.active
                  : `${theme.menu} ${theme.hover}`
              }`}
            >
              <span>{item.icon}</span>
              <span className="font-medium">{t[item.key]}</span>
            </button>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="mt-auto bg-red-500 hover:bg-red-600 text-white py-3 rounded-2xl cursor-pointer transition"
        >
          {t.logout}
        </button>
      </aside>

      <main className={`flex-1 p-8 ${theme.main}`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <h1 className="text-2xl font-bold text-violet-600">{t.brand}</h1>

          <h2 className={`text-xl md:text-2xl font-semibold ${theme.text}`}>
            {greetingText}
          </h2>

          <div className="flex items-center gap-3">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={`border rounded-xl px-4 py-2 outline-none ${theme.select}`}
            >
              <option value="uz">O'zbekcha</option>
              <option value="en">English</option>
              <option value="ru">Русский</option>
            </select>

            <button
              className={`w-10 h-10 flex items-center justify-center rounded-xl border cursor-pointer ${theme.topBtn}`}
            >
              🔔
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-10 h-10 flex items-center justify-center rounded-xl border cursor-pointer ${theme.topBtn}`}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>

            <div className="relative">
              <button
                ref={profileButtonRef}
                onClick={() => setShowProfilePanel((prev) => !prev)}
                className="w-10 h-10 rounded-full bg-amber-900 text-white flex items-center justify-center font-bold cursor-pointer"
                title="Profil"
              >
                {profileInitial}
              </button>

              {showProfilePanel && (
                <div
                  ref={profilePanelRef}
                  className={`absolute right-0 top-12 z-40 w-72 rounded-2xl border p-4 shadow-2xl ${theme.card} ${theme.rowBorder}`}
                >
                  <p
                    className={`text-xs uppercase tracking-wide ${theme.soft}`}
                  >
                    Profil
                  </p>
                  <h3 className={`text-base font-semibold mt-1 ${theme.text}`}>
                    {profileName}
                  </h3>
                  <p className={`text-sm mt-1 ${theme.soft}`}>
                    {authUser?.email || "Email yo'q"}
                  </p>

                  <button
                    onClick={() => setShowProfilePanel(false)}
                    className="mt-4 w-full rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-2.5 text-sm"
                  >
                    Yopish
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {renderContent()}
      </main>
    </div>
  );
}
