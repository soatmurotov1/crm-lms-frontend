import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { groupsApi, studentsApi } from "../../api/crmApi";
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
  const [profileLoading, setProfileLoading] = useState(false);
  const [studentProfile, setStudentProfile] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSubmitAttempted, setPasswordSubmitAttempted] = useState(false);
  const [serverPasswordError, setServerPasswordError] = useState("");
  const [notice, setNotice] = useState({ type: "", text: "" });
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordTouched, setPasswordTouched] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [showPassword, setShowPassword] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

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
    studentProfile?.fullName ||
    authUser?.fullName ||
    authUser?.email?.split("@")[0] ||
    "Talaba";
  const profileEmail = studentProfile?.email || authUser?.email || "-";
  const profileFullName = String(profileName).trim() || "-";
  const profileBirthDate = studentProfile?.birth_date
    ? new Date(studentProfile.birth_date).toLocaleDateString("uz-UZ")
    : "-";
  const profileInitial =
    String(profileName).trim().charAt(0).toUpperCase() || "T";

  const passwordErrors = useMemo(() => {
    const errors = {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    };

    const shouldValidateOld =
      passwordSubmitAttempted || passwordTouched.oldPassword;
    const shouldValidateNew =
      passwordSubmitAttempted || passwordTouched.newPassword;
    const shouldValidateConfirm =
      passwordSubmitAttempted || passwordTouched.confirmPassword;

    if (shouldValidateOld && !passwordForm.oldPassword.trim()) {
      errors.oldPassword = "Amaldagi parolni kiriting";
    }

    if (shouldValidateNew && !passwordForm.newPassword.trim()) {
      errors.newPassword = "Yangi parolni kiriting";
    } else if (
      passwordForm.newPassword &&
      passwordForm.newPassword.length < 8
    ) {
      errors.newPassword = "Kamida 8 xonali bo'lishi kerak";
    } else if (
      passwordForm.oldPassword &&
      passwordForm.newPassword &&
      passwordForm.oldPassword === passwordForm.newPassword
    ) {
      errors.newPassword = "Amaldagi va yangi parol bir xil bo'lmasligi kerak";
    }

    if (shouldValidateConfirm && !passwordForm.confirmPassword.trim()) {
      errors.confirmPassword = "Parolni tasdiqlang";
    } else if (
      passwordForm.confirmPassword &&
      passwordForm.newPassword !== passwordForm.confirmPassword
    ) {
      errors.confirmPassword = "Yangi parol va tasdiq bir xil bo'lishi kerak";
    }

    if (serverPasswordError) {
      errors.oldPassword = serverPasswordError;
    }

    return errors;
  }, [
    passwordForm,
    passwordSubmitAttempted,
    passwordTouched,
    serverPasswordError,
  ]);

  const hasPasswordErrors =
    Boolean(passwordErrors.oldPassword) ||
    Boolean(passwordErrors.newPassword) ||
    Boolean(passwordErrors.confirmPassword);

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
    const loadProfile = async () => {
      try {
        setProfileLoading(true);
        const result = await studentsApi.getMyProfile();
        setStudentProfile(result?.data || null);
      } catch {
        setStudentProfile(null);
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
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

  const openPasswordModal = () => {
    setShowPasswordModal(true);
    setPasswordSubmitAttempted(false);
    setServerPasswordError("");
    setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    setPasswordTouched({
      oldPassword: false,
      newPassword: false,
      confirmPassword: false,
    });
    setShowPassword({
      oldPassword: false,
      newPassword: false,
      confirmPassword: false,
    });
  };

  const updatePasswordField = (field, value) => {
    setServerPasswordError("");
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
    setPasswordTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSavePassword = async () => {
    setPasswordSubmitAttempted(true);
    setServerPasswordError("");

    if (hasPasswordErrors) {
      return;
    }

    try {
      setSavingPassword(true);
      await studentsApi.changeMyPassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      setNotice({ type: "success", text: "Parol muvaffaqiyatli yangilandi" });
      setShowPasswordModal(false);
    } catch (error) {
      const message =
        error?.response?.data?.message || "Parolni o'zgartirib bo'lmadi";
      if (String(message).toLowerCase().includes("amaldagi parol")) {
        setServerPasswordError("Amaldagi parol noto'g'ri");
      } else {
        setNotice({ type: "error", text: String(message) });
      }
    } finally {
      setSavingPassword(false);
    }
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
          className={`${theme.sidebar} border-r ${theme.card} w-72 flex flex-col min-h-0`}
        >
          <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
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

          <div className="px-4 pb-4 pt-2 border-t border-slate-200/70">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-2xl cursor-pointer transition"
            >
              {t.logout}
            </button>
          </div>
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
            <div className="space-y-6">
              {notice.text ? (
                <div
                  className={`rounded-xl px-4 py-3 text-sm font-medium ${
                    notice.type === "error"
                      ? "bg-red-100 text-red-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {notice.text}
                </div>
              ) : null}

              <div className={`${theme.card} border rounded-2xl p-6 shadow-sm`}>
                <h2 className={`text-3xl font-bold mb-8 ${theme.text}`}>
                  Shaxsiy ma'lumotlar
                </h2>

                {profileLoading ? (
                  <p className={theme.soft}>Ma'lumotlar yuklanmoqda...</p>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    <div className="xl:col-span-5 flex flex-col md:flex-row gap-6 items-center md:items-start">
                      <div className="text-center">
                        <img
                          src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=500&auto=format&fit=crop"
                          alt="Namuna"
                          className="w-32 h-32 object-cover border border-slate-400"
                        />
                        <p className={`text-xl mt-2 ${theme.text}`}>Namuna</p>
                        <p className={`text-xl mt-4 ${theme.soft}`}>
                          500x500 o'lcham, JPEG, JPG, PNG format, maksimum 2MB
                        </p>
                      </div>

                      <div className="text-center">
                        <img
                          src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=500&auto=format&fit=crop"
                          alt={profileName}
                          className="w-36 h-36 rounded-full object-cover"
                        />
                        <span className="inline-flex mt-4 bg-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-md">
                          Talabga mos
                        </span>
                      </div>
                    </div>

                    <div className="xl:col-span-3 space-y-6">
                      <div>
                        <p className={`${theme.soft} text-lg`}>Full name</p>
                        <p className={`${theme.text} text-2xl font-semibold`}>
                          {profileFullName}
                        </p>
                      </div>

                      <div>
                        <p className={`${theme.soft} text-lg`}>Email</p>
                        <p
                          className={`${theme.text} text-2xl font-semibold break-all`}
                        >
                          {profileEmail}
                        </p>
                      </div>

                      <div>
                        <p className={`${theme.soft} text-lg`}>Jinsi</p>
                        <p className={`${theme.text} text-2xl font-semibold`}>
                          -
                        </p>
                      </div>
                    </div>

                    <div className="xl:col-span-4 space-y-6">
                      <div>
                        <p className={`${theme.soft} text-lg`}>
                          Tug'ilgan sana
                        </p>
                        <p className={`${theme.text} text-2xl font-semibold`}>
                          {profileBirthDate}
                        </p>
                      </div>

                      <div>
                        <p className={`${theme.soft} text-lg`}>HH ID</p>
                        <p className={`${theme.text} text-2xl font-semibold`}>
                          {studentProfile?.id || authUser?.id || "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div
                  className={`${theme.card} border rounded-2xl p-6 shadow-sm min-h-48`}
                >
                  <h3 className={`${theme.text} text-2xl font-semibold mb-6`}>
                    Kirish
                  </h3>
                  <p className={`${theme.text} text-xl break-all`}>
                    {profileEmail}
                  </p>
                </div>

                <div
                  className={`${theme.card} border rounded-2xl p-6 shadow-sm min-h-48`}
                >
                  <div className="flex items-start justify-between">
                    <h3 className={`${theme.text} text-2xl font-semibold mb-6`}>
                      Parol
                    </h3>
                    <button
                      type="button"
                      onClick={openPasswordModal}
                      className="text-2xl cursor-pointer"
                      aria-label="Parolni o'zgartirish"
                    >
                      ✏️
                    </button>
                  </div>
                  <p className={`${theme.text} text-2xl tracking-widest`}>
                    ••••••••
                  </p>
                </div>

                <div
                  className={`${theme.card} border rounded-2xl p-6 shadow-sm min-h-48`}
                >
                  <div className="flex items-start justify-between">
                    <h3 className={`${theme.text} text-2xl font-semibold mb-6`}>
                      Bildirishnoma sozlamalari
                    </h3>
                    <button
                      type="button"
                      className="text-2xl cursor-pointer"
                      aria-label="Tahrirlash"
                    >
                      ✏️
                    </button>
                  </div>
                </div>
              </div>

              <div
                className={`${theme.card} border rounded-2xl p-6 shadow-sm min-h-28`}
              >
                <h3 className={`${theme.text} text-2xl`}>Shartnomalarim</h3>
              </div>
            </div>
          )}
        </main>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-4xl font-bold text-slate-800">
                  Parolni o'zgartirish
                </h3>
                <p className="text-slate-600 mt-4 text-xl">
                  Quyidagi ma'lumotlarni to'ldiring
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-500 hover:text-slate-700 text-5xl leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            {["oldPassword", "newPassword", "confirmPassword"].map(
              (fieldKey) => {
                const labels = {
                  oldPassword: "Amaldagi parol",
                  newPassword: "Yangi parol",
                  confirmPassword: "Parolni tasdiqlash",
                };

                return (
                  <div key={fieldKey} className="mb-5">
                    <label className="block text-slate-600 mb-2 text-xl">
                      {labels[fieldKey]}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword[fieldKey] ? "text" : "password"}
                        value={passwordForm[fieldKey]}
                        onChange={(event) =>
                          updatePasswordField(fieldKey, event.target.value)
                        }
                        placeholder="Parolingizni kiriting"
                        className={`w-full rounded-xl border px-4 py-3 pr-12 text-xl outline-none ${
                          passwordErrors[fieldKey]
                            ? "border-red-500 focus:ring-2 focus:ring-red-200"
                            : "border-slate-300 focus:ring-2 focus:ring-emerald-200"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword((prev) => ({
                            ...prev,
                            [fieldKey]: !prev[fieldKey],
                          }))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 cursor-pointer"
                      >
                        👁️
                      </button>
                    </div>
                    {passwordErrors[fieldKey] ? (
                      <p className="text-red-500 text-lg mt-2">
                        {passwordErrors[fieldKey]}
                      </p>
                    ) : null}
                  </div>
                );
              },
            )}

            <button
              type="button"
              onClick={handleSavePassword}
              disabled={savingPassword}
              className="w-full mt-4 rounded-xl bg-[#BE925D] hover:bg-[#a77f4e] disabled:opacity-70 text-white text-3xl font-semibold py-3 cursor-pointer"
            >
              {savingPassword ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
