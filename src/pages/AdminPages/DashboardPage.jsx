import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import RoomsPage from "./RoomsPage";
import EmployeesPage from "./XodimlarPage";
import TeachersPage from "./TeachersPage";
import StudentsPage from "./StudentsPage";
import PaymentsPage from "./PaymentsPage";
import GroupsPage from "./GroupsPage";
import GroupDetailsPage from "./GroupDetrailsPage";
import {
  coursesApi,
  groupsApi,
  paymentsApi,
  studentsApi,
} from "../../api/crmApi";
import { getAuthUserFromStorage } from "../../utils/authToken";

const menuItems = [
  { id: 1, key: "home", icon: "🏠" },
  { id: 2, key: "teachers", icon: "👨‍🏫" },
  { id: 3, key: "groups", icon: "📚" },
  { id: 4, key: "students", icon: "🎓" },
  { id: 5, key: "payments", icon: "💳" },
  { id: 6, key: "management", icon: "⚙️" },
];

const managementItems = [
  { id: 1, key: "courses", icon: "📘" },
  { id: 2, key: "rooms", icon: "🚪" },
  { id: 3, key: "employees", icon: "👤" },
  { id: 4, key: "teachers", icon: "👨‍🏫" },
];

const statsData = [
  { id: 1, key: "activeStudents", icon: "🎓" },
  { id: 2, key: "groups", icon: "👥" },
  { id: 3, key: "frozen", icon: "❄️" },
  { id: 4, key: "archived", icon: "🗂️" },
];

const WEEKDAY_ENUMS = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

const categories = [
  { id: 1, name: "Web dasturlash" },
  { id: 2, name: "English" },
  { id: 3, name: "Xalqaro" },
  { id: 4, name: "3D grafik dizayn" },
];

const translations = {
  uz: {
    brand: "Najot Talim",
    greeting: "Salom",
    welcome: "Najot Talim platformasiga xush kelibsiz",
    logout: "Chiqish",
    home: "Asosiy",
    teachers: "O‘qituvchilar",
    groups: "Guruhlar",
    students: "Talabalar",
    payments: "To'lovlar",
    management: "Boshqarish",
    courses: "Kurslar",
    rooms: "Xonalar",
    employees: "Hodimlar",
    activeStudents: "Faol talabalar",
    frozen: "Muzlatilganlar",
    archived: "Arxivdagilar",
    monthlyPayments: "Joriy oy uchun to‘lovlar",
    paid: "To‘langan",
    pending: "Kutilmoqda",
    balance: "Qoldiq",
    schedule: "Dars jadvali",
    noScheduleToday: "Bugun dars yo‘q",
    active: "Faol",
    today: "Bugun",
    teachersText: "Bu yerda o‘qituvchilar ro‘yxati chiqadi.",
    groupsText: "Bu yerda guruhlar ro‘yxati chiqadi.",
    studentsText: "Bu yerda talabalar ro‘yxati chiqadi.",
    roomsText: "Bu yerda xonalar bo‘limi chiqadi.",
    employeesText: "Bu yerda hodimlar bo‘limi chiqadi.",
    faqText: "Bu yerda FAQ bo‘limi chiqadi.",
    inspectionText: "Bu yerda tekshiruv bo‘limi chiqadi.",
    addCourse: "Kurs qo'shish",
    editCourse: "Kursni tahrirlash",
    cancel: "Bekor qilish",
    save: "Saqlash",
    courseName: "Nomi",
    courseNamePlaceholder: "Kurs nomi",
    courseDurationMin: "Dars davomiyligi (min)",
    courseDurationMonth: "Kurs davomiyligi (oy)",
    price: "Narx",
    pricePlaceholder: "Masalan: 250000",
    description: "Tavsif",
    descriptionPlaceholder: "Kurs haqida qisqacha...",
    choose: "Tanlang",
    courseCategoriesTable: "Kurs kategoriyalari",
    noComment: "Izoh yo'q",
    menu: "Menu",
  },
  en: {
    brand: "Najot Talim",
    greeting: "Hello",
    welcome: "Welcome to Najot Talim platform",
    logout: "Logout",
    home: "Home",
    teachers: "Teachers",
    groups: "Groups",
    students: "Students",
    payments: "Payments",
    management: "Management",
    courses: "Courses",
    rooms: "Rooms",
    employees: "Employees",
    faq: "FAQ",
    inspection: "Inspection",
    activeStudents: "Active students",
    frozen: "Frozen",
    archived: "Archived",
    monthlyPayments: "Monthly payments",
    paid: "Paid",
    pending: "Pending",
    balance: "Balance",
    schedule: "Class schedule",
    noScheduleToday: "No classes today",
    active: "Active",
    today: "Today",
    teachersText: "Teachers list will appear here.",
    groupsText: "Groups list will appear here.",
    studentsText: "Students list will appear here.",
    roomsText: "Rooms section will appear here.",
    employeesText: "Employees section will appear here.",
    faqText: "FAQ section will appear here.",
    inspectionText: "Inspection section will appear here.",
    addCourse: "Add course",
    editCourse: "Edit course",
    cancel: "Cancel",
    save: "Save",
    courseName: "Name",
    courseNamePlaceholder: "Course name",
    courseDurationMin: "Lesson duration (min)",
    courseDurationMonth: "Course duration (month)",
    price: "Price",
    pricePlaceholder: "Example: 250000",
    description: "Description",
    descriptionPlaceholder: "Short description...",
    choose: "Select",
    courseCategoriesTable: "Course categories",
    noComment: "No description",
    menu: "Menu",
  },
  ru: {
    brand: "Najot Talim",
    greeting: "Здравствуйте",
    welcome: "Добро пожаловать на платформу Najot Talim",
    logout: "Выйти",
    home: "Главная",
    teachers: "Учителя",
    groups: "Группы",
    students: "Студенты",
    payments: "Платежи",
    management: "Управление",
    courses: "Курсы",
    rooms: "Комнаты",
    employees: "Сотрудники",
    activeStudents: "Активные студенты",
    frozen: "Замороженные",
    archived: "В архиве",
    monthlyPayments: "Платежи за текущий месяц",
    paid: "Оплачено",
    pending: "Ожидается",
    balance: "Остаток",
    schedule: "Расписание занятий",
    noScheduleToday: "Сегодня занятий нет",
    active: "Активный",
    today: "Сегодня",
    teachersText: "Здесь будет список учителей.",
    groupsText: "Здесь будет список групп.",
    studentsText: "Здесь будет список студентов.",
    roomsText: "Здесь будет раздел комнат.",
    employeesText: "Здесь будет раздел сотрудников.",
    faqText: "Здесь будет раздел FAQ.",
    inspectionText: "Здесь будет раздел проверки.",
    addCourse: "Добавить курс",
    editCourse: "Редактировать курс",
    cancel: "Отмена",
    save: "Сохранить",
    courseName: "Название",
    courseNamePlaceholder: "Название курса",
    courseDurationMin: "Длительность урока (мин)",
    courseDurationMonth: "Длительность курса (месяц)",
    price: "Цена",
    pricePlaceholder: "Например: 250000",
    description: "Описание",
    descriptionPlaceholder: "Кратко о курсе...",
    choose: "Выберите",
    courseCategoriesTable: "Категории курса",
    noComment: "Нет описания",
    menu: "Меню",
  },
};

function InputField({
  label,
  name,
  value,
  onChange,
  placeholder,
  theme,
  type = "text",
}) {
  return (
    <div>
      <label className={`block text-sm font-medium mb-2 ${theme.text}`}>
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full rounded-xl border px-4 py-3 outline-none ${theme.input}`}
      />
    </div>
  );
}

function SelectField({ label, name, value, onChange, items, theme, choose }) {
  return (
    <div>
      <label className={`block text-sm font-medium mb-2 ${theme.text}`}>
        {label}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full rounded-xl border px-4 py-3 outline-none ${theme.input}`}
      >
        <option value="">{choose}</option>
        {items.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function DashboardPage({
  initialMenu = "home",
  initialManagement = "courses",
}) {
  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState(initialMenu);
  const [activeManagement, setActiveManagement] = useState(initialManagement);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupDetailsKey, setGroupDetailsKey] = useState(0);
  const [showManagementPanel, setShowManagementPanel] = useState(false);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("uz");
  const [showCourseDrawer, setShowCourseDrawer] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState(null);

  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [courseSaving, setCourseSaving] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    activeStudents: 0,
    groups: 0,
    frozen: 0,
    archived: 0,
  });
  const [monthlyPayments, setMonthlyPayments] = useState({
    paid: 0,
    pending: 0,
    debt: 0,
    loading: true,
  });
  const [scheduleData, setScheduleData] = useState({
    groups: [],
    coursesById: {},
  });

  const [formData, setFormData] = useState({
    title: "",
    durationMin: "",
    durationMonth: "",
    price: "",
    description: "",
  });

  const managementButtonRef = useRef(null);
  const managementPanelRef = useRef(null);
  const profileButtonRef = useRef(null);
  const profilePanelRef = useRef(null);

  const t = useMemo(() => translations[language], [language]);
  const authUser = useMemo(() => getAuthUserFromStorage(), []);
  const greetingName = useMemo(() => {
    const baseName =
      authUser?.fullName || authUser?.email?.split("@")[0] || "Foydalanuvchi";
    const parts = String(baseName).trim().split(/\s+/).filter(Boolean);

    if (parts.length >= 2) {
      return `${parts[parts.length - 1]} ${parts.slice(0, -1).join(" ")}`;
    }

    return baseName;
  }, [authUser]);
  const greetingText = `${t.greeting}, ${greetingName}!`;
  const profileName =
    authUser?.fullName || authUser?.email?.split("@")[0] || "Foydalanuvchi";
  const profileInitial =
    String(profileName).trim().charAt(0).toUpperCase() || "F";
  const profileRole = String(authUser?.role || "USER").toUpperCase();
  const formatUzs = (value) =>
    `${new Intl.NumberFormat("uz-UZ").format(Number(value || 0))} so'm`;

  useEffect(() => {
    setActiveMenu(initialMenu);
    setActiveManagement(initialManagement);

    if (initialMenu !== "groups") {
      setSelectedGroup(null);
    }
  }, [initialMenu, initialManagement]);

  const menuPathMap = {
    home: "/dashboard",
    teachers: "/dashboard/teacher",
    groups: "/dashboard/group",
    students: "/dashboard/student",
    payments: "/dashboard/payments",
    management: "/dashboard",
  };

  const managementPathMap = {
    courses: "/dashboard/course",
    rooms: "/dashboard/room",
    employees: "/dashboard",
    teachers: "/dashboard/teacher",
    faq: "/dashboard",
    inspection: "/dashboard",
  };

  const openMenu = (menuKey) => {
    setSelectedGroup(null);
    setActiveMenu(menuKey);
    setShowManagementPanel(false);
    navigate(menuPathMap[menuKey] || "/dashboard");
  };

  const openManagementMenu = (managementKey) => {
    setSelectedGroup(null);
    setActiveMenu("management");
    setActiveManagement(managementKey);
    setShowManagementPanel(false);
    navigate(managementPathMap[managementKey] || "/dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("crm_access_token");
    setShowProfilePanel(false);
    navigate("/", { replace: true });
  };

  const todaySchedule = useMemo(() => {
    const todayEnum = WEEKDAY_ENUMS[new Date().getDay()];

    const toEndTime = (startTime, durationMinutes) => {
      if (!startTime || !durationMinutes) return "-";

      const [hour = 0, minute = 0] = String(startTime)
        .split(":")
        .map((n) => Number(n));
      const startMinutes = hour * 60 + minute;
      const endMinutes = startMinutes + Number(durationMinutes || 0);
      const endHour = Math.floor(endMinutes / 60) % 24;
      const endMinute = endMinutes % 60;

      return `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`;
    };

    return (scheduleData.groups || [])
      .filter(
        (group) =>
          Array.isArray(group.weekDays) && group.weekDays.includes(todayEnum),
      )
      .map((group) => {
        const course = scheduleData.coursesById[group.courseId];
        const duration = Number(course?.durationLesson || 0);
        return {
          id: group.id,
          name: group.name || "-",
          startTime: group.startTime || "-",
          endTime: toEndTime(group.startTime, duration),
        };
      })
      .sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));
  }, [scheduleData]);

  const loadCourses = async () => {
    try {
      setCoursesLoading(true);
      const result = await coursesApi.getAll();
      const list = Array.isArray(result?.data) ? result.data : [];
      setCourses(
        list.map((course) => ({
          id: course.id,
          title: course.name,
          durationMin: String(course.durationLesson ?? ""),
          durationMonth: String(course.durationMonth ?? ""),
          price: String(course.price ?? ""),
          description: course.description || t.noComment,
        })),
      );
    } catch (error) {
      setCourses([]);
    } finally {
      setCoursesLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    const loadDashboardStats = async () => {
      const [studentsRes, groupsRes, coursesRes] = await Promise.allSettled([
        studentsApi.getAll(),
        groupsApi.getAll(),
        coursesApi.getAll(),
      ]);

      const students =
        studentsRes.status === "fulfilled" &&
        Array.isArray(studentsRes.value?.data)
          ? studentsRes.value.data
          : [];
      const groups =
        groupsRes.status === "fulfilled" && Array.isArray(groupsRes.value?.data)
          ? groupsRes.value.data
          : [];
      const courses =
        coursesRes.status === "fulfilled" &&
        Array.isArray(coursesRes.value?.data)
          ? coursesRes.value.data
          : [];

      setScheduleData({
        groups,
        coursesById: Object.fromEntries(
          courses.map((course) => [course.id, course]),
        ),
      });

      setDashboardStats({
        activeStudents: students.filter(
          (student) => student.status === "ACTIVE",
        ).length,
        groups: groups.length,
        frozen: groups.filter((group) => group.status === "FREEZE").length,
        archived: groups.filter((group) => group.status === "INACTIVE").length,
      });
    };

    loadDashboardStats();
  }, []);

  useEffect(() => {
    const loadMonthlyPayments = async () => {
      try {
        setMonthlyPayments((prev) => ({ ...prev, loading: true }));
        const now = new Date();
        const result = await paymentsApi.getMonthlySummary({
          year: now.getFullYear(),
          month: now.getMonth() + 1,
        });
        const payload = result?.data ?? result ?? {};
        setMonthlyPayments({
          paid: payload?.paid || 0,
          pending: payload?.pending || 0,
          debt: payload?.debt || 0,
          loading: false,
        });
      } catch {
        setMonthlyPayments((prev) => ({ ...prev, loading: false }));
      }
    };

    loadMonthlyPayments();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showManagementPanel &&
        managementPanelRef.current &&
        !managementPanelRef.current.contains(event.target) &&
        managementButtonRef.current &&
        !managementButtonRef.current.contains(event.target)
      ) {
        setShowManagementPanel(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showManagementPanel]);

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
        subpanel: "bg-slate-900 border-slate-800",
        submenuActive: "bg-violet-600 text-white",
        submenuText: "text-slate-200",
        rowBorder: "border-slate-700",
        input:
          "bg-slate-900 border-slate-700 text-white placeholder:text-slate-500",
        overlay: "bg-black/50",
        tab: "bg-slate-900 text-slate-300 border-slate-700",
        tabActive: "bg-violet-600 text-white border-violet-600",
        chip: "bg-slate-800 text-slate-300 border-slate-700",
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
        subpanel: "bg-white border-slate-200",
        submenuActive: "bg-violet-100 text-violet-700",
        submenuText: "text-slate-700",
        rowBorder: "border-slate-200",
        input:
          "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400",
        overlay: "bg-black/30",
        tab: "bg-white text-slate-600 border-slate-200",
        tabActive: "bg-violet-100 text-violet-700 border-violet-200",
        chip: "bg-slate-50 text-slate-600 border-slate-200",
      };

  const resetForm = () => {
    setEditingCourseId(null);
    setFormData({
      title: "",
      durationMin: "",
      durationMonth: "",
      price: "",
      description: "",
    });
  };

  const openAddDrawer = () => {
    resetForm();
    setShowCourseDrawer(true);
  };

  const openEditDrawer = (course) => {
    setEditingCourseId(course.id);
    setFormData({
      title: course.title,
      durationMin: course.durationMin,
      durationMonth: course.durationMonth,
      price: course.price,
      description: course.description,
    });
    setShowCourseDrawer(true);
  };

  const closeDrawer = () => {
    setShowCourseDrawer(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveCourse = async () => {
    if (
      !formData.title.trim() ||
      !formData.durationMin.trim() ||
      !formData.durationMonth.trim() ||
      !formData.price.trim()
    ) {
      return;
    }

    try {
      setCourseSaving(true);
      const payload = {
        name: formData.title.trim(),
        durationLesson: Number(formData.durationMin),
        durationMonth: Number(formData.durationMonth),
        price: formData.price,
        description: formData.description || t.noComment,
      };

      if (editingCourseId) {
        await coursesApi.update(editingCourseId, payload);
      } else {
        await coursesApi.create(payload);
      }

      await loadCourses();
      closeDrawer();
      resetForm();
    } catch (error) {
      alert(error?.response?.data?.message || "Kursni saqlashda xato");
    } finally {
      setCourseSaving(false);
    }
  };

  const handleDeleteCourse = async (id) => {
    try {
      await coursesApi.remove(id);
      await loadCourses();
    } catch (error) {
      alert(error?.response?.data?.message || "Kursni o'chirishda xato");
    }
  };

  const renderBox = (title, text) => (
    <div className={`${theme.card} border rounded-2xl p-8 shadow-sm`}>
      <h2 className={`text-3xl font-bold mb-4 ${theme.text}`}>{title}</h2>
      <p className={theme.soft}>{text}</p>
    </div>
  );

  const renderCoursesSection = () => {
    return (
      <div className="space-y-6">
        <div className={`${theme.card} border rounded-2xl p-5 shadow-sm`}>
          <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
            <h2 className={`text-2xl font-bold ${theme.text}`}>{t.courses}</h2>

            <button
              onClick={openAddDrawer}
              className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-3 rounded-xl font-medium"
            >
              + {t.addCourse}
            </button>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">
            {coursesLoading && (
              <div
                className={`${theme.card} border rounded-2xl p-5 shadow-sm ${theme.soft}`}
              >
                Kurslar yuklanmoqda...
              </div>
            )}
            {!coursesLoading &&
              courses.map((course) => (
                <div
                  key={course.id}
                  className={`${theme.card} border rounded-2xl p-5 shadow-sm`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className={`text-lg font-semibold ${theme.text}`}>
                        {course.title}
                      </h3>
                      <p className={`text-sm mt-1 ${theme.soft}`}>
                        {course.description}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-red-50"
                      >
                        🗑️
                      </button>
                      <button
                        onClick={() => openEditDrawer(course)}
                        className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-50"
                      >
                        ✏️
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-5">
                    <span
                      className={`px-3 py-1 rounded-full text-xs border ${theme.chip}`}
                    >
                      {course.durationMin} min
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs border ${theme.chip}`}
                    >
                      {course.durationMonth} oy
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs border ${theme.chip}`}
                    >
                      {Number(course.price).toLocaleString()} so'm
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className={`${theme.card} border rounded-2xl p-5 shadow-sm`}>
          <h3 className={`text-xl font-semibold mb-4 ${theme.text}`}>
            {t.courseCategoriesTable}
          </h3>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className={darkMode ? "bg-slate-800" : "bg-slate-50"}>
                <tr>
                  <th className={`text-left px-4 py-3 ${theme.text}`}>#</th>
                  <th className={`text-left px-4 py-3 ${theme.text}`}>Nomi</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((item) => (
                  <tr key={item.id} className={`border-t ${theme.rowBorder}`}>
                    <td className={`px-4 py-3 ${theme.text}`}>{item.id}</td>
                    <td className={`px-4 py-3 ${theme.text}`}>{item.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showCourseDrawer && (
          <div className={`fixed inset-0 z-50 ${theme.overlay}`}>
            <div className="absolute inset-y-0 right-0 w-full max-w-107.5 bg-white shadow-2xl overflow-y-auto">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                  {editingCourseId ? t.editCourse : t.addCourse}
                </h2>

                <button
                  onClick={closeDrawer}
                  className="text-slate-500 text-xl"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-5">
                <InputField
                  label={t.courseName}
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  placeholder={t.courseNamePlaceholder}
                  theme={theme}
                />

                <SelectField
                  label={t.courseDurationMin}
                  name="durationMin"
                  value={formData.durationMin}
                  onChange={handleFormChange}
                  choose={t.choose}
                  items={[
                    { value: "60", label: "60 min" },
                    { value: "90", label: "90 min" },
                    { value: "120", label: "120 min" },
                  ]}
                  theme={theme}
                />

                <SelectField
                  label={t.courseDurationMonth}
                  name="durationMonth"
                  value={formData.durationMonth}
                  onChange={handleFormChange}
                  choose={t.choose}
                  items={[
                    { value: "3", label: "3 oy" },
                    { value: "6", label: "6 oy" },
                    { value: "9", label: "9 oy" },
                    { value: "12", label: "12 oy" },
                  ]}
                  theme={theme}
                />

                <InputField
                  label={t.price}
                  name="price"
                  value={formData.price}
                  onChange={handleFormChange}
                  placeholder={t.pricePlaceholder}
                  theme={theme}
                />

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${theme.text}`}
                  >
                    {t.description}
                  </label>
                  <textarea
                    rows="4"
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    placeholder={t.descriptionPlaceholder}
                    className={`w-full rounded-xl border px-4 py-3 outline-none resize-none ${theme.input}`}
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
                <button
                  onClick={closeDrawer}
                  className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600"
                >
                  {t.cancel}
                </button>

                <button
                  onClick={handleSaveCourse}
                  disabled={courseSaving}
                  className="px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium"
                >
                  {courseSaving ? "Saqlanmoqda..." : t.save}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderManagementContent = () => {
    if (activeManagement === "courses") return renderCoursesSection();
    if (activeManagement === "rooms")
      return <RoomsPage theme={theme} darkMode={darkMode} />;
    if (activeManagement === "employees")
      return <EmployeesPage theme={theme} darkMode={darkMode} />;
    if (activeManagement === "teachers")
      return (
        <TeachersPage
          theme={theme}
          darkMode={darkMode}
          currentUser={authUser}
        />
      );
    if (activeManagement === "faq") return renderBox(t.faq, t.faqText);
    if (activeManagement === "inspection")
      return renderBox(t.inspection, t.inspectionText);
    return null;
  };

  const handleStatCardClick = (key) => {
    if (key === "activeStudents") {
      openMenu("students");
      return;
    }

    if (key === "groups") {
      openMenu("groups");
    }
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
      navigate(`/dashboard/group?${params.toString()}`);
    }
  };

  const handleGroupBack = () => {
    setSelectedGroup(null);
    navigate("/dashboard/group");
  };

  const handleGroupTabChange = (tabKey) => {
    if (!selectedGroup?.id) return;
    const params = new URLSearchParams();
    params.set("groupId", String(selectedGroup.id));
    params.set("tab", tabKey);
    navigate(`/dashboard/group?${params.toString()}`, { replace: true });
  };

  const renderContent = () => {
    if (activeMenu === "home") {
      return (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
            {statsData.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleStatCardClick(item.key)}
                className={`${theme.card} border rounded-2xl p-5 shadow-sm text-left ${
                  {
                    activeStudents: "cursor-pointer hover:shadow-md",
                    groups: "cursor-pointer hover:shadow-md",
                  }[item.key] || "cursor-default"
                }`}
              >
                <div className="text-3xl mb-3">{item.icon}</div>
                <p className={`mb-2 text-sm ${theme.soft}`}>{t[item.key]}</p>
                <h3 className={`text-3xl font-bold ${theme.text}`}>
                  {dashboardStats[item.key] ?? 0}
                </h3>
              </button>
            ))}
          </div>

          <div className="space-y-5">
            <div className={`${theme.card} border rounded-2xl p-6 shadow-sm`}>
              <h2 className={`text-2xl font-semibold mb-4 ${theme.text}`}>
                {t.monthlyPayments}
              </h2>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="rounded-2xl bg-emerald-50 p-5">
                  <p className="text-slate-500 mb-2">{t.paid}</p>
                  <h3 className="text-2xl font-bold text-emerald-600">
                    {monthlyPayments.loading
                      ? "..."
                      : formatUzs(monthlyPayments.paid)}
                  </h3>
                </div>

                <div className="rounded-2xl bg-yellow-50 p-5">
                  <p className="text-slate-500 mb-2">{t.pending}</p>
                  <h3 className="text-2xl font-bold text-yellow-600">
                    {monthlyPayments.loading
                      ? "..."
                      : formatUzs(monthlyPayments.pending)}
                  </h3>
                </div>

                <div className="rounded-2xl bg-red-50 p-5">
                  <p className="text-slate-500 mb-2">{t.balance}</p>
                  <h3 className="text-2xl font-bold text-red-500">
                    {monthlyPayments.loading
                      ? "..."
                      : formatUzs(monthlyPayments.debt)}
                  </h3>
                </div>
              </div>
            </div>

            <div className={`${theme.card} border rounded-2xl p-6 shadow-sm`}>
              <h2 className={`text-2xl font-semibold mb-4 ${theme.text}`}>
                {t.schedule}
              </h2>

              <div className="space-y-4">
                {todaySchedule.length === 0 && (
                  <div
                    className={`rounded-2xl border p-4 text-sm ${theme.rowBorder} ${theme.soft}`}
                  >
                    {t.noScheduleToday}
                  </div>
                )}

                {todaySchedule.map((lesson) => (
                  <div
                    key={lesson.id}
                    className={`flex items-center justify-between rounded-2xl border p-4 ${theme.rowBorder}`}
                  >
                    <div>
                      <h3 className={`font-semibold text-lg ${theme.text}`}>
                        {lesson.name}
                      </h3>
                      <p className={theme.soft}>
                        {lesson.startTime} - {lesson.endTime}
                      </p>
                    </div>
                    <span className="px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm">
                      {t.today}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      );
    }

    if (activeMenu === "payments")
      return <PaymentsPage theme={theme} darkMode={darkMode} />;

    if (activeMenu === "teachers")
      return (
        <TeachersPage
          theme={theme}
          darkMode={darkMode}
          currentUser={authUser}
        />
      );

    if (activeMenu === "groups") {
      if (selectedGroup) {
        return (
          <GroupDetailsPage
            key={groupDetailsKey}
            theme={theme}
            darkMode={darkMode}
            group={selectedGroup}
            onBack={handleGroupBack}
            onTabChange={handleGroupTabChange}
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
    }

    if (activeMenu === "students")
      return (
        <StudentsPage
          theme={theme}
          darkMode={darkMode}
          onOpenGroupDetails={openGroupDetails}
        />
      );
    if (activeMenu === "management") return renderManagementContent();

    return null;
  };

  return (
    <div className={`min-h-screen flex ${theme.app}`}>
      <aside
        className={`relative w-60 border-r p-4 flex flex-col ${theme.sidebar}`}
      >
        <h1 className="text-2xl font-bold text-violet-600 mb-8">{t.brand}</h1>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            if (item.key === "management") {
              return (
                <button
                  key={item.id}
                  ref={managementButtonRef}
                  onClick={() => {
                    setActiveMenu("management");
                    setShowManagementPanel((prev) => !prev);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-left transition cursor-pointer ${
                    activeMenu === "management"
                      ? theme.active
                      : `${theme.menu} ${theme.hover}`
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span>{item.icon}</span>
                    <span className="font-medium">{t[item.key]}</span>
                  </div>
                  <span>{showManagementPanel ? "◂" : "▸"}</span>
                </button>
              );
            }

            return (
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
            );
          })}
        </nav>

        {showManagementPanel && (
          <div
            ref={managementPanelRef}
            className={`absolute top-18 left-55 w-52.5 rounded-r-2xl rounded-bl-2xl border p-4 shadow-2xl z-30 ${theme.subpanel}`}
          >
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setShowManagementPanel(false)}
                className="w-7 h-7 rounded-md bg-violet-500 text-white flex items-center justify-center text-sm"
              >
                ‹
              </button>
              <h3 className={`text-lg font-semibold ${theme.text}`}>
                {t.menu}
              </h3>
            </div>

            <div className="space-y-2">
              {managementItems.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => openManagementMenu(sub.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition cursor-pointer ${
                    activeManagement === sub.key && activeMenu === "management"
                      ? theme.submenuActive
                      : `${theme.submenuText} hover:bg-slate-100/70`
                  }`}
                >
                  <span>{sub.icon}</span>
                  <span className="text-sm font-medium">{t[sub.key]}</span>
                </button>
              ))}
            </div>
          </div>
        )}

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
                  <p className={`text-xs mt-2 ${theme.soft}`}>
                    Rol: {profileRole}
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
