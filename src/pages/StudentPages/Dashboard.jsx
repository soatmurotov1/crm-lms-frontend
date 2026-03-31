import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { groupsApi } from "../../api/crmApi";
import { getAuthUserFromStorage } from "../../utils/authToken";
import StudentGroups from "./Groups";

const menuItems = [
  { id: 1, key: "home", label: "Bosh sahifa", icon: "🏠" },
  { id: 2, key: "groups", label: "Guruhlarim", icon: "👥" },
  { id: 3, key: "settings", label: "Sozlamalar", icon: "⚙️" },
];

const translations = {
  uz: {
    brand: "Najot Talim",
    studentPanel: "Student panel",
    greeting: "Salom",
    welcome: "Najot Talim platformasiga xush kelibsiz",
    logout: "Chiqish",
    home: "Bosh sahifa",
    groups: "Guruhlarim",
    settings: "Sozlamalar",
    homeText:
      "Bu student uchun asosiy panel. Guruhlarim bo'limida darslaringizni ko'rishingiz mumkin.",
    settingsText: "Bu bo'lim keyingi bosqichda to'ldiriladi.",
    loadingGroups: "Guruhlar yuklanmoqda...",
  },
  en: {
    brand: "Najot Talim",
    studentPanel: "Student Panel",
    greeting: "Hello",
    welcome: "Welcome to Najot Talim platform",
    logout: "Logout",
    home: "Home",
    groups: "My Groups",
    settings: "Settings",
    homeText:
      "This is the main student panel. You can view your classes in My Groups section.",
    settingsText: "This section will be filled in the next step.",
    loadingGroups: "Loading groups...",
  },
  ru: {
    brand: "Najot Talim",
    studentPanel: "Студентская панель",
    greeting: "Привет",
    welcome: "Добро пожаловать на платформу Najot Talim",
    logout: "Выход",
    home: "Главная",
    groups: "Мои группы",
    settings: "Настройки",
    homeText:
      "Это главная студенческая панель. Вы можете просматривать свои классы в разделе Мои группы.",
    settingsText: "Этот раздел будет заполнен на следующем этапе.",
    loadingGroups: "Загрузка групп...",
  },
};

export default function StudentDashboardPage({ initialMenu = "home" }) {
  const navigate = useNavigate();
  const authUser = useMemo(() => getAuthUserFromStorage(), []);
  const [activeMenu, setActiveMenu] = useState(initialMenu);
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("uz");
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const profileButtonRef = useRef(null);
  const profilePanelRef = useRef(null);

  const t = useMemo(() => translations[language], [language]);

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
      };

  const greetingName = useMemo(() => {
    const baseName =
      authUser?.fullName || authUser?.email?.split("@")[0] || "Talaba";
    const parts = String(baseName).trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[parts.length - 1]} ${parts.slice(0, -1).join(" ")}`;
    }
    return baseName;
  }, [authUser]);

  const greetingText = `${t.greeting}, ${greetingName}!`;
  const profileName =
    authUser?.fullName || authUser?.email?.split("@")[0] || "Talaba";
  const profileInitial =
    String(profileName).trim().charAt(0).toUpperCase() || "T";

  useEffect(() => {
    setActiveMenu(initialMenu);
  }, [initialMenu]);

  useEffect(() => {
    if (activeMenu === "home") {
      navigate("/student/dashboard", { replace: true });
      return;
    }

    if (activeMenu === "groups") {
      navigate("/student/groups", { replace: true });
      return;
    }

    if (activeMenu === "settings") {
      navigate("/student/settings", { replace: true });
    }
  }, [activeMenu, navigate]);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        setGroupsLoading(true);
        const result = await groupsApi.getAll();
        const list = Array.isArray(result?.data) ? result.data : [];
        setGroups(list);
      } catch {
        setGroups([]);
      } finally {
        setGroupsLoading(false);
      }
    };

    loadGroups();
  }, []);

  useEffect(() => {
    const handleProfileOutside = (event) => {
      if (
        showProfilePanel &&
        profilePanelRef.current &&
        !profilePanelRef.current.contains(event.target) &&
        profileButtonRef.current &&
        !profileButtonRef.current.contains(event.target)
      ) {
        setShowProfilePanel(false);
      }
    };

    document.addEventListener("mousedown", handleProfileOutside);
    return () =>
      document.removeEventListener("mousedown", handleProfileOutside);
  }, [showProfilePanel]);

  const handleLogout = () => {
    localStorage.removeItem("crm_access_token");
    setShowProfilePanel(false);
    navigate("/", { replace: true });
  };

  return (
    <div className={`${theme.app} min-h-screen flex flex-col`}>
      {/* Header */}
      <header className={`${theme.sidebar} border-b ${theme.card} shadow-sm`}>
        <div className="flex items-center justify-between px-6 py-4 gap-4">
          <h1 className={`text-2xl font-bold ${theme.text}`}>{t.brand}</h1>

          <div className="flex items-center gap-4">
            {/* Language & Theme */}
            <div className="flex gap-2">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className={`px-3 py-2 rounded-lg border text-sm outline-none ${theme.topBtn}`}
              >
                <option value="uz">Uz</option>
                <option value="en">En</option>
                <option value="ru">Ru</option>
              </select>

              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`px-3 py-2 rounded-lg border font-semibold text-sm outline-none ${theme.topBtn}`}
              >
                {darkMode ? "☀️" : "🌙"}
              </button>
            </div>

            {/* Profile Button */}
            <div className="relative">
              <button
                ref={profileButtonRef}
                onClick={() => setShowProfilePanel(!showProfilePanel)}
                className={`w-10 h-10 rounded-full font-bold flex items-center justify-center text-sm cursor-pointer border ${theme.active}`}
              >
                {profileInitial}
              </button>

              {/* Profile Panel */}
              {showProfilePanel && (
                <div
                  ref={profilePanelRef}
                  className={`absolute top-full right-0 mt-2 w-64 ${theme.card} border rounded-xl shadow-2xl z-50 p-4`}
                >
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-400">
                    <div
                      className={`w-12 h-12 rounded-full font-bold flex items-center justify-center ${theme.active}`}
                    >
                      {profileInitial}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${theme.text}`}>
                        {profileName}
                      </p>
                      <p className={`text-xs ${theme.soft}`}>
                        {authUser?.email || "student@najot.talim"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium mt-2"
                  >
                    {t.logout}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Menu */}
        <aside
          className={`${theme.sidebar} border-r ${theme.card} w-72 overflow-y-auto`}
        >
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left cursor-pointer transition-all font-medium ${
                  activeMenu === item.key
                    ? theme.active
                    : `${theme.menu} ${theme.hover}`
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Area */}
        <main className={`${theme.main} flex-1 overflow-y-auto p-6`}>
          {activeMenu === "home" && (
            <div className={`${theme.card} border rounded-2xl p-8 shadow-sm`}>
              <h2 className={`text-3xl font-bold mb-4 ${theme.text}`}>
                {greetingText}
              </h2>
              <p className={theme.soft}>{t.homeText}</p>
            </div>
          )}

          {activeMenu === "groups" &&
            (groupsLoading ? (
              <div
                className={`${theme.card} border rounded-2xl p-6 shadow-sm ${theme.soft}`}
              >
                {t.loadingGroups}
              </div>
            ) : (
              <StudentGroups groups={groups} />
            ))}

          {activeMenu === "settings" && (
            <div className={`${theme.card} border rounded-2xl p-8 shadow-sm`}>
              <h2 className={`text-2xl font-bold mb-4 ${theme.text}`}>
                {t.settings}
              </h2>
              <p className={theme.soft}>{t.settingsText}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
