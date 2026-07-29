import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import RoomsPage from "./RoomsPage";
import EmployeesPage from "./XodimlarPage";
import TeachersPage from "./TeachersPage";
import StudentsPage from "./StudentsPage";
import PaymentsPage from "./PaymentsPage";
import GroupsPage from "./GroupsPage";
import GroupDetailsPage from "./GroupDetrailsPage";
import ExamsPage from "./ExamsPage";
import {
  attendanceApi,
  coursesApi,
  groupsApi,
  paymentsApi,
  studentsApi,
} from "../../api/crmApi";
import StatCard from "../../components/ui/StatCard";
import Card from "../../components/ui/Card";
import SectionHeader from "../../components/ui/SectionHeader";
import ChartFallback from "../../components/ui/ChartFallback";
import ListCard from "../../components/ui/ListCard";
import PlaceholderSection from "../../components/ui/PlaceholderSection";
import NotificationsSection from "../../components/notifications/NotificationsSection";
import PanelLayout from "../../components/layout/PanelLayout";

// Recharts og'ir kutubxona — faqat dashboard ochilganda yuklanadi,
// login sahifasining bundle'iga tushmasligi uchun lazy import qilinadi.
const RevenueLineChart = lazy(
  () => import("../../components/charts/RevenueLineChart"),
);
const PaymentsDonut = lazy(
  () => import("../../components/charts/PaymentsDonut"),
);
const AttendanceBars = lazy(
  () => import("../../components/charts/AttendanceBars"),
);
import {
  clearAuthSession,
  getAuthUserFromStorage,
} from "../../utils/authToken";
import { useTheme } from "../../theme/themeContext";

const menuItems = [
  { id: 1, key: "dashboard", icon: "🏠" },
  { id: 2, key: "students", icon: "🎓" },
  { id: 3, key: "groups", icon: "📚" },
  { id: 4, key: "teachers", icon: "👨‍🏫" },
  { id: 5, key: "attendance", icon: "✅" },
  { id: 6, key: "payments", icon: "💳" },
  { id: 7, key: "reports", icon: "📊" },
  { id: 8, key: "notifications", icon: "🔔" },
  { id: 9, key: "settings", icon: "⚙️" },
];

// Eski "Boshqarish" bo'limi endi "Sozlamalar" ichidagi tablar sifatida yashaydi.
const managementItems = [
  { id: 1, key: "courses", icon: "📘" },
  { id: 2, key: "rooms", icon: "🚪" },
  { id: 3, key: "employees", icon: "👤" },
  { id: 4, key: "exams", icon: "📝" },
];

const statsData = [
  { id: 1, key: "totalStudents", icon: "🎓" },
  { id: 2, key: "activeGroups", icon: "📚" },
  { id: 3, key: "todayAttendance", icon: "✅" },
  { id: 4, key: "debtors", icon: "⚠️" },
];

const STAT_TONES = {
  totalStudents: "violet",
  activeGroups: "blue",
  todayAttendance: "emerald",
  debtors: "rose",
};

const CLICKABLE_STATS = ["totalStudents", "activeGroups", "debtors"];

// Eski route'lardagi menyu kalitlari yangi menyuga moslashtiriladi.
const LEGACY_MENU_MAP = {
  home: "dashboard",
  management: "settings",
  exams: "settings",
};

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

const STORAGE_KEY = "crm_admin_dashboard_cache_v1";

const readDashboardCache = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeDashboardCache = (payload) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage errors and keep app usable.
  }
};

const translations = {
  uz: {
    brand: "EduCenter",
    greeting: "Salom",
    welcomeTitle: "Xush kelibsiz",
    welcome: "EduCenter platformasiga xush kelibsiz",
    logout: "Chiqish",
    home: "Asosiy",
    teachers: "O‘qituvchilar",
    groups: "Guruhlar",
    students: "O'quvchilar",
    payments: "To'lovlar",
    exams: "Examlar",
    management: "Boshqarish",
    dashboard: "Boshqaruv paneli",
    attendance: "Davomat",
    reports: "Hisobotlar",
    notifications: "Xabarnomalar",
    settings: "Sozlamalar",
    totalStudents: "Jami o'quvchilar",
    activeGroups: "Faol guruhlar",
    todayAttendance: "Bugungi davomat",
    debtors: "Qarzdorlar",
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
    brand: "EduCenter",
    greeting: "Hello",
    welcomeTitle: "Welcome",
    welcome: "Welcome to EduCenter platform",
    logout: "Logout",
    home: "Home",
    teachers: "Teachers",
    groups: "Groups",
    students: "Students",
    payments: "Payments",
    exams: "Exams",
    management: "Management",
    dashboard: "Dashboard",
    attendance: "Attendance",
    reports: "Reports",
    notifications: "Notifications",
    settings: "Settings",
    totalStudents: "Total students",
    activeGroups: "Active groups",
    todayAttendance: "Today's attendance",
    debtors: "Debtors",
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
    brand: "EduCenter",
    greeting: "Здравствуйте",
    welcomeTitle: "Добро пожаловать",
    welcome: "Добро пожаловать на платформу EduCenter",
    logout: "Выйти",
    home: "Главная",
    teachers: "Учителя",
    groups: "Группы",
    students: "Студенты",
    payments: "Платежи",
    exams: "Экзамены",
    management: "Управление",
    dashboard: "Панель управления",
    attendance: "Посещаемость",
    reports: "Отчёты",
    notifications: "Уведомления",
    settings: "Настройки",
    totalStudents: "Всего учеников",
    activeGroups: "Активные группы",
    todayAttendance: "Посещаемость сегодня",
    debtors: "Должники",
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
  const cached = useMemo(() => readDashboardCache(), []);

  const [activeMenu, setActiveMenu] = useState(
    () => LEGACY_MENU_MAP[cached?.activeMenu || initialMenu] ||
      cached?.activeMenu ||
      initialMenu,
  );
  const [activeManagement, setActiveManagement] = useState(() =>
    initialMenu === "exams"
      ? "exams"
      : cached?.activeManagement || initialManagement,
  );
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupDetailsKey, setGroupDetailsKey] = useState(0);
  const { darkMode, theme } = useTheme();
  const [language, setLanguage] = useState(() => cached?.language || "uz");
  const [showCourseDrawer, setShowCourseDrawer] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState(null);

  const [courses, setCourses] = useState(() =>
    Array.isArray(cached?.courses) ? cached.courses : [],
  );
  const [coursesLoading, setCoursesLoading] = useState(
    () => !Array.isArray(cached?.courses),
  );
  const [courseSaving, setCourseSaving] = useState(false);
  const [dashboardStats, setDashboardStats] = useState(
    () =>
      cached?.dashboardStats || {
        totalStudents: 0,
        activeGroups: 0,
        frozen: 0,
        archived: 0,
      },
  );
  const [revenueMonths, setRevenueMonths] = useState([]);
  const [attendanceDays, setAttendanceDays] = useState([]);
  const [paymentRows, setPaymentRows] = useState([]);
  const [monthlyPayments, setMonthlyPayments] = useState(() =>
    cached?.monthlyPayments
      ? { ...cached.monthlyPayments, loading: false }
      : {
          paid: 0,
          pending: 0,
          debt: 0,
          loading: true,
        },
  );
  const [scheduleData, setScheduleData] = useState(
    () =>
      cached?.scheduleData || {
        groups: [],
        coursesById: {},
      },
  );

  const [formData, setFormData] = useState({
    title: "",
    durationMin: "",
    durationMonth: "",
    price: "",
    description: "",
  });

  const t = useMemo(() => translations[language], [language]);
  const authUser = useMemo(() => getAuthUserFromStorage(), []);
  const greetingName = useMemo(() => {
    const baseName =
      authUser?.fullName || authUser?.phone || "Foydalanuvchi";
    const parts = String(baseName).trim().split(/\s+/).filter(Boolean);

    if (parts.length >= 2) {
      return `${parts[parts.length - 1]} ${parts.slice(0, -1).join(" ")}`;
    }

    return baseName;
  }, [authUser]);
  const profileRole = String(authUser?.role || "USER").toUpperCase();
  const formatUzs = (value) =>
    `${new Intl.NumberFormat("uz-UZ").format(Number(value || 0))} so'm`;

  // Bugungi davomat foizi — haftalik statistikadagi shu kunga tegishli yozuv.
  const todayAttendance = useMemo(() => {
    const todayWeekday = new Date().getDay();
    const entry = attendanceDays.find(
      (day) => Number(day?.weekday) === todayWeekday,
    );

    return {
      percent: Number(entry?.percent || 0),
      present: Number(entry?.present || 0),
      total: Number(entry?.total || 0),
    };
  }, [attendanceDays]);

  // Qarzdorlar — joriy oyda to'lovi "DEBT" holatida turgan noyob o'quvchilar.
  const debtorRows = useMemo(
    () => paymentRows.filter((row) => row.status === "DEBT"),
    [paymentRows],
  );

  const debtorsCount = useMemo(
    () => new Set(debtorRows.map((row) => row.studentId)).size,
    [debtorRows],
  );

  const statValues = {
    totalStudents: dashboardStats.totalStudents ?? 0,
    activeGroups: dashboardStats.activeGroups ?? 0,
    todayAttendance: `${todayAttendance.percent}%`,
    debtors: debtorsCount,
  };

  const statHints = {
    todayAttendance: todayAttendance.total
      ? `${todayAttendance.present} / ${todayAttendance.total} belgilangan`
      : "Bugun davomat belgilanmagan",
    debtors: debtorsCount ? "Joriy oy uchun to'lanmagan" : "Qarzdor yo'q",
  };

  useEffect(() => {
    writeDashboardCache({
      activeMenu,
      activeManagement,
      language,
      courses,
      dashboardStats,
      monthlyPayments,
      scheduleData,
    });
  }, [
    activeMenu,
    activeManagement,
    language,
    courses,
    dashboardStats,
    monthlyPayments,
    scheduleData,
  ]);

  useEffect(() => {
    setActiveMenu(LEGACY_MENU_MAP[initialMenu] || initialMenu);
    setActiveManagement(
      initialMenu === "exams" ? "exams" : initialManagement,
    );

    if (initialMenu !== "groups") {
      setSelectedGroup(null);
    }
  }, [initialMenu, initialManagement]);

  const menuPathMap = {
    dashboard: "/dashboard",
    teachers: "/dashboard/teacher",
    groups: "/dashboard/group",
    students: "/dashboard/student",
    attendance: "/dashboard/attendance",
    payments: "/dashboard/payments",
    reports: "/dashboard/reports",
    notifications: "/dashboard/notifications",
    settings: "/dashboard/settings",
  };

  /*
    Har bir "Sozlamalar" tabining o'z manzili bo'lishi shart. Aks holda
    manzil `/dashboard/settings` ga ketadi, u yerdan `initialManagement`
    sukut bo'yicha "courses" bo'lib qaytadi va quyidagi useEffect tanlangan
    tabni yana "Kurslar" ga almashtirib yuboradi.
  */
  const managementPathMap = {
    courses: "/dashboard/course",
    rooms: "/dashboard/room",
    employees: "/dashboard/employees",
    exams: "/dashboard/exams",
  };

  const openMenu = (menuKey) => {
    setSelectedGroup(null);
    setActiveMenu(menuKey);
    navigate(menuPathMap[menuKey] || "/dashboard");
  };

  const openManagementMenu = (managementKey) => {
    setSelectedGroup(null);
    setActiveMenu("settings");
    setActiveManagement(managementKey);
    navigate(managementPathMap[managementKey] || "/dashboard/settings");
  };

  const handleLogout = () => {
    clearAuthSession();
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
        totalStudents: students.length,
        activeGroups: groups.filter((group) => group.status === "ACTIVE")
          .length,
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
    const loadCharts = async () => {
      const now = new Date();
      const [yearly, weekly, monthlyList] = await Promise.allSettled([
        paymentsApi.getYearlySummary({ year: now.getFullYear() }),
        attendanceApi.getWeeklyStats(),
        paymentsApi.getMonthlyList({
          year: now.getFullYear(),
          month: now.getMonth() + 1,
        }),
      ]);

      if (monthlyList.status === "fulfilled") {
        const payload = monthlyList.value;
        setPaymentRows(
          Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.data)
              ? payload.data
              : [],
        );
      }

      if (yearly.status === "fulfilled") {
        const payload = yearly.value?.data ?? yearly.value ?? {};
        setRevenueMonths(Array.isArray(payload?.months) ? payload.months : []);
      }

      if (weekly.status === "fulfilled") {
        const payload = weekly.value?.data ?? weekly.value ?? [];
        setAttendanceDays(Array.isArray(payload) ? payload : []);
      }
    };

    loadCharts();
  }, []);

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
                        className={`w-8 h-8 rounded-lg border ${theme.rowBorder} ${
                          darkMode ? "hover:bg-red-900/30" : "hover:bg-red-50"
                        }`}
                      >
                        🗑️
                      </button>
                      <button
                        onClick={() => openEditDrawer(course)}
                        className={`w-8 h-8 rounded-lg border ${theme.rowBorder} ${theme.hover}`}
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

          <div className={`overflow-hidden rounded-xl border ${theme.rowBorder}`}>
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
            <div
              className={`absolute inset-y-0 right-0 w-full max-w-107.5 shadow-2xl overflow-y-auto ${
                darkMode ? "bg-slate-900" : "bg-white"
              }`}
            >
              <div
                className={`p-6 border-b flex items-center justify-between ${theme.rowBorder}`}
              >
                <h2 className={`text-xl font-bold ${theme.text}`}>
                  {editingCourseId ? t.editCourse : t.addCourse}
                </h2>

                <button
                  onClick={closeDrawer}
                  className={`text-xl ${theme.soft}`}
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

              <div
                className={`p-6 border-t flex justify-end gap-3 ${theme.rowBorder}`}
              >
                <button
                  onClick={closeDrawer}
                  className={`px-5 py-3 rounded-xl border ${theme.rowBorder} ${theme.text}`}
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
    if (activeManagement === "exams") return <ExamsPage />;
    return null;
  };

  // "Sozlamalar" bo'limi eski "Boshqarish" ostidagi sahifalarni tab ko'rinishida
  // saqlab qoladi — shu bilan kurslar/xonalar/hodimlar/examlar yo'qolmaydi.
  const renderSettingsSection = () => (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {managementItems.map((item) => (
          <button
            key={item.id}
            onClick={() => openManagementMenu(item.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition cursor-pointer ${
              activeManagement === item.key ? theme.tabActive : theme.tab
            }`}
          >
            <span>{item.icon}</span>
            <span>{t[item.key]}</span>
          </button>
        ))}
      </div>

      {renderManagementContent()}
    </div>
  );

  const handleStatCardClick = (key) => {
    if (key === "totalStudents") {
      openMenu("students");
      return;
    }

    if (key === "activeGroups") {
      openMenu("groups");
      return;
    }

    if (key === "debtors") {
      openMenu("payments");
    }
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
      navigate(
        `${menuPathMap[menuKey] || "/dashboard/group"}?${params.toString()}`,
      );
    }
  };

  const handleGroupBack = () => {
    setSelectedGroup(null);
    navigate(menuPathMap[activeMenu] || "/dashboard/group");
  };

  const handleGroupTabChange = (tabKey) => {
    if (!selectedGroup?.id) return;
    const params = new URLSearchParams();
    params.set("groupId", String(selectedGroup.id));
    params.set("tab", tabKey);
    navigate(
      `${menuPathMap[activeMenu] || "/dashboard/group"}?${params.toString()}`,
      { replace: true },
    );
  };

  const renderContent = () => {
    if (activeMenu === "dashboard") {
      return (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
            {statsData.map((item) => (
              <StatCard
                key={item.id}
                icon={item.icon}
                tone={STAT_TONES[item.key]}
                label={t[item.key]}
                value={statValues[item.key] ?? 0}
                deltaLabel={statHints[item.key]}
                onClick={
                  CLICKABLE_STATS.includes(item.key)
                    ? () => handleStatCardClick(item.key)
                    : undefined
                }
              />
            ))}
          </div>

          <div className="space-y-5">
            <div className="grid gap-5 xl:grid-cols-3">
              <Card className="xl:col-span-2">
                <SectionHeader
                  title="Davomat statistikasi"
                  subtitle="Oxirgi 7 kun"
                />
                <Suspense fallback={<ChartFallback height={260} />}>
                  <AttendanceBars days={attendanceDays} />
                </Suspense>
              </Card>

              <Card>
                <SectionHeader
                  title="To'lovlar statistikasi"
                  subtitle="To'langan · Qarzdorlik · Kutilmoqda"
                />
                {monthlyPayments.loading ? (
                  <p className={`text-sm ${theme.soft}`}>Yuklanmoqda...</p>
                ) : (
                  <Suspense fallback={<ChartFallback height={240} />}>
                    <PaymentsDonut
                      paid={monthlyPayments.paid}
                      debt={monthlyPayments.debt}
                      pending={monthlyPayments.pending}
                    />
                  </Suspense>
                )}
              </Card>
            </div>

            <Card>
              <SectionHeader
                title="Daromad statistikasi"
                subtitle={`${new Date().getFullYear()}-yil, oylar kesimida`}
              />
              <Suspense fallback={<ChartFallback height={260} />}>
                <RevenueLineChart months={revenueMonths} />
              </Suspense>
            </Card>

            <Card>
              <SectionHeader title={t.monthlyPayments} />

              <div className="grid md:grid-cols-3 gap-4">
                <div
                  className={`rounded-2xl border p-5 ${theme.rowBorder} ${darkMode ? "bg-emerald-500/10" : "bg-emerald-50"}`}
                >
                  <p className={`mb-2 text-sm ${theme.soft}`}>{t.paid}</p>
                  <h3
                    className={`text-2xl font-bold ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}
                  >
                    {monthlyPayments.loading
                      ? "..."
                      : formatUzs(monthlyPayments.paid)}
                  </h3>
                </div>

                <div
                  className={`rounded-2xl border p-5 ${theme.rowBorder} ${darkMode ? "bg-amber-500/10" : "bg-yellow-50"}`}
                >
                  <p className={`mb-2 text-sm ${theme.soft}`}>{t.pending}</p>
                  <h3
                    className={`text-2xl font-bold ${darkMode ? "text-amber-400" : "text-yellow-600"}`}
                  >
                    {monthlyPayments.loading
                      ? "..."
                      : formatUzs(monthlyPayments.pending)}
                  </h3>
                </div>

                <div
                  className={`rounded-2xl border p-5 ${theme.rowBorder} ${darkMode ? "bg-rose-500/10" : "bg-red-50"}`}
                >
                  <p className={`mb-2 text-sm ${theme.soft}`}>{t.balance}</p>
                  <h3
                    className={`text-2xl font-bold ${darkMode ? "text-rose-400" : "text-red-500"}`}
                  >
                    {monthlyPayments.loading
                      ? "..."
                      : formatUzs(monthlyPayments.debt)}
                  </h3>
                </div>
              </div>
            </Card>

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

    if (activeMenu === "attendance") {
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
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <StatCard
              icon="✅"
              tone="emerald"
              label={t.todayAttendance}
              value={`${todayAttendance.percent}%`}
              deltaLabel={statHints.todayAttendance}
            />
            <StatCard
              icon="🎓"
              tone="violet"
              label="Bugun kelganlar"
              value={todayAttendance.present}
            />
            <StatCard
              icon="📋"
              tone="blue"
              label="Bugun belgilanganlar"
              value={todayAttendance.total}
            />
          </div>

          <Card>
            <SectionHeader
              title="Davomat statistikasi"
              subtitle="Oxirgi 7 kun"
            />
            <Suspense fallback={<ChartFallback height={260} />}>
              <AttendanceBars days={attendanceDays} />
            </Suspense>
          </Card>

          <Card>
            <SectionHeader
              title="Guruh bo'yicha davomat"
              subtitle="Guruhni tanlang — akademik davomat jadvali ochiladi"
            />
            <GroupsPage
              theme={theme}
              darkMode={darkMode}
              currentUser={authUser}
              onOpenGroupDetails={(group) =>
                openGroupDetails(
                  { ...group, initialMainTab: "akademik-davomat" },
                  "attendance",
                )
              }
            />
          </Card>
        </div>
      );
    }

    if (activeMenu === "reports") {
      return (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <StatCard
              icon="🎓"
              tone="violet"
              label={t.totalStudents}
              value={statValues.totalStudents}
            />
            <StatCard
              icon="📚"
              tone="blue"
              label={t.activeGroups}
              value={statValues.activeGroups}
            />
            <StatCard
              icon="💰"
              tone="emerald"
              label={t.paid}
              value={formatUzs(monthlyPayments.paid)}
            />
            <StatCard
              icon="⚠️"
              tone="rose"
              label={t.debtors}
              value={debtorsCount}
            />
          </div>

          <Card>
            <SectionHeader
              title="Daromad statistikasi"
              subtitle={`${new Date().getFullYear()}-yil, oylar kesimida`}
            />
            <Suspense fallback={<ChartFallback height={260} />}>
              <RevenueLineChart months={revenueMonths} />
            </Suspense>
          </Card>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card>
              <SectionHeader
                title="Davomat statistikasi"
                subtitle="Oxirgi 7 kun"
              />
              <Suspense fallback={<ChartFallback height={260} />}>
                <AttendanceBars days={attendanceDays} />
              </Suspense>
            </Card>

            <Card>
              <SectionHeader
                title="To'lovlar statistikasi"
                subtitle="To'langan · Qarzdorlik · Kutilmoqda"
              />
              <Suspense fallback={<ChartFallback height={240} />}>
                <PaymentsDonut
                  paid={monthlyPayments.paid}
                  debt={monthlyPayments.debt}
                  pending={monthlyPayments.pending}
                />
              </Suspense>
            </Card>
          </div>

          <ListCard
            title="Qarzdorlar ro'yxati"
            subtitle="Joriy oy uchun to'lov qilinmagan o'quvchilar"
            items={debtorRows.map((row, index) => ({
              id: `${row.studentId}-${row.groupId}-${index}`,
              title: row.studentName,
              meta: `${row.groupName} · ${formatUzs(row.amount)}`,
              badge: "Qarz",
              tone: "rose",
              icon: "⚠️",
            }))}
            emptyText="Qarzdor o'quvchi yo'q"
            maxHeight={360}
          />
        </div>
      );
    }

    if (activeMenu === "notifications") {
      return (
        <NotificationsSection
          canSend
          canViewAll
          canDelete
          groups={scheduleData.groups}
          title={t.notifications}
          subtitle="O'quvchilar va o'qituvchilarga xabar yuborish"
        />
      );
    }

    if (activeMenu === "settings") return renderSettingsSection();

    return null;
  };

  return (
    <PanelLayout
      brand={t.brand}
      menuItems={menuItems.map((item) => ({
        key: item.key,
        label: t[item.key],
        icon: item.icon,
      }))}
      activeKey={activeMenu}
      onSelect={openMenu}
      greeting={`${t.welcomeTitle}, Admin`}
      subtitle={`${greetingName} · ${t[activeMenu] || ""}`}
      user={authUser}
      roleLabel={profileRole}
      logoutLabel={t.logout}
      onLogout={handleLogout}
      headerExtra={
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className={`border rounded-xl px-3 py-2 outline-none text-sm ${theme.select}`}
        >
          <option value="uz">O'zbekcha</option>
          <option value="en">English</option>
          <option value="ru">Русский</option>
        </select>
      }
    >
      {renderContent()}
    </PanelLayout>
  );
}
