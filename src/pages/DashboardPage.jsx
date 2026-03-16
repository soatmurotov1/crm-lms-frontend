import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import RoomsPage from "./RoomsPage";
import EmployeesPage from "./XodimlarPage";
import TeachersPage from "./TeachersPage";
import StudentsPage from "./StudentsPage";
import GroupsPage from "./GroupsPage";
import GroupDetailsPage from "./GroupDetrailsPage";
import { coursesApi, groupsApi, studentsApi } from "../api/crmApi";
import { getAuthUserFromStorage } from "../utils/authToken";

const menuItems = [
  { id: 1, key: "home", icon: "🏠" },
  { id: 2, key: "teachers", icon: "👨‍🏫" },
  { id: 3, key: "groups", icon: "📚" },
  { id: 4, key: "students", icon: "🎓" },
  { id: 5, key: "management", icon: "⚙️" },
];

const managementItems = [
  { id: 1, key: "courses", icon: "📘" },
  { id: 2, key: "rooms", icon: "🚪" },
  { id: 3, key: "employees", icon: "👤" },
  { id: 4, key: "teachers", icon: "👨‍🏫" },
  { id: 5, key: "faq", icon: "❓" },
  { id: 6, key: "inspection", icon: "🛡️" },
];

const statsData = [
  { id: 1, key: "activeStudents", icon: "🎓" },
  { id: 2, key: "groups", icon: "👥" },
  { id: 3, key: "frozen", icon: "❄️" },
  { id: 4, key: "archived", icon: "🗂️" },
];

const defaultCourses = [
  {
    id: 1,
    title: "Nemis tili",
    description: "Izoh yo‘q",
    durationMin: "60",
    durationMonth: "12",
    price: "300000",
  },
  {
    id: 2,
    title: "Math",
    description: "Izoh yo‘q",
    durationMin: "120",
    durationMonth: "9",
    price: "400000",
  },
  {
    id: 3,
    title: "SAT foundation",
    description: "SAT matematika qismi 0 dan boshlab o‘rgatiladi",
    durationMin: "60",
    durationMonth: "6",
    price: "350000",
  },
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
    management: "Boshqarish",
    courses: "Kurslar",
    rooms: "Xonalar",
    employees: "Hodimlar",
    faq: "FAQ",
    inspection: "Tekshiruv",
    activeStudents: "Faol talabalar",
    frozen: "Muzlatilganlar",
    archived: "Arxivdagilar",
    monthlyPayments: "Joriy oy uchun to‘lovlar",
    paid: "To‘langan",
    pending: "Kutilmoqda",
    balance: "Qoldiq",
    schedule: "Dars jadvali",
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
    management: "Управление",
    courses: "Курсы",
    rooms: "Комнаты",
    employees: "Сотрудники",
    faq: "FAQ",
    inspection: "Проверка",
    activeStudents: "Активные студенты",
    frozen: "Замороженные",
    archived: "В архиве",
    monthlyPayments: "Платежи за текущий месяц",
    paid: "Оплачено",
    pending: "Ожидается",
    balance: "Остаток",
    schedule: "Расписание занятий",
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

export default function DashboardPage({ initialMenu = "home" }) {
  const navigate = useNavigate();
  const loginToastTimerRef = useRef(null);

  const [activeMenu, setActiveMenu] = useState(initialMenu);
  const [activeManagement, setActiveManagement] = useState("courses");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showManagementPanel, setShowManagementPanel] = useState(false);
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
  const [loginToast, setLoginToast] = useState({
    show: false,
    message: "",
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

  const t = useMemo(() => translations[language], [language]);
  const authUser = useMemo(() => getAuthUserFromStorage(), []);
  const greetingName =
    authUser?.fullName || authUser?.email?.split("@")[0] || "Foydalanuvchi";
  const greetingText = `${t.greeting}, ${greetingName}!`;

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
      const [studentsRes, groupsRes] = await Promise.allSettled([
        studentsApi.getAll(),
        groupsApi.getAll(),
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
    const message = localStorage.getItem("crm_login_success_message");
    if (!message) return;

    localStorage.removeItem("crm_login_success_message");
    setLoginToast({ show: true, message });

    loginToastTimerRef.current = setTimeout(() => {
      setLoginToast((prev) => ({ ...prev, show: false }));
    }, 2400);

    return () => {
      if (loginToastTimerRef.current) {
        clearTimeout(loginToastTimerRef.current);
      }
    };
  }, []);

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

  const renderContent = () => {
    if (activeMenu === "home") {
      return (
        <>
          <div className="mb-8">
            <h1 className={`text-3xl md:text-4xl font-bold ${theme.text}`}>
              {greetingText}
            </h1>
            <p className={`mt-2 text-base md:text-lg ${theme.soft}`}>
              {t.welcome}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
            {statsData.map((item) => (
              <div
                key={item.id}
                className={`${theme.card} border rounded-2xl p-5 shadow-sm`}
              >
                <div className="text-3xl mb-3">{item.icon}</div>
                <p className={`mb-2 text-sm ${theme.soft}`}>{t[item.key]}</p>
                <h3 className={`text-3xl font-bold ${theme.text}`}>
                  {dashboardStats[item.key] ?? 0}
                </h3>
              </div>
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
                    12 500 000 so‘m
                  </h3>
                </div>

                <div className="rounded-2xl bg-yellow-50 p-5">
                  <p className="text-slate-500 mb-2">{t.pending}</p>
                  <h3 className="text-2xl font-bold text-yellow-600">
                    3 800 000 so‘m
                  </h3>
                </div>

                <div className="rounded-2xl bg-red-50 p-5">
                  <p className="text-slate-500 mb-2">{t.balance}</p>
                  <h3 className="text-2xl font-bold text-red-500">
                    2 100 000 so‘m
                  </h3>
                </div>
              </div>
            </div>

            <div className={`${theme.card} border rounded-2xl p-6 shadow-sm`}>
              <h2 className={`text-2xl font-semibold mb-4 ${theme.text}`}>
                {t.schedule}
              </h2>

              <div className="space-y-4">
                <div
                  className={`flex items-center justify-between rounded-2xl border p-4 ${theme.rowBorder}`}
                >
                  <div>
                    <h3 className={`font-semibold text-lg ${theme.text}`}>
                      Frontend N45
                    </h3>
                    <p className={theme.soft}>08:30 - 10:00</p>
                  </div>
                  <span className="px-4 py-2 rounded-full bg-violet-100 text-violet-700 text-sm">
                    {t.active}
                  </span>
                </div>

                <div
                  className={`flex items-center justify-between rounded-2xl border p-4 ${theme.rowBorder}`}
                >
                  <div>
                    <h3 className={`font-semibold text-lg ${theme.text}`}>
                      Backend N21
                    </h3>
                    <p className={theme.soft}>11:00 - 12:30</p>
                  </div>
                  <span className="px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm">
                    {t.today}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      );
    }

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
            theme={theme}
            darkMode={darkMode}
            group={selectedGroup}
            onBack={() => setSelectedGroup(null)}
          />
        );
      }

      return (
        <GroupsPage
          theme={theme}
          darkMode={darkMode}
          currentUser={authUser}
          onOpenGroupDetails={(group) => {
            setSelectedGroup(group);
            setActiveMenu("groups");
          }}
        />
      );
    }

    if (activeMenu === "students")
      return <StudentsPage theme={theme} darkMode={darkMode} />;
    if (activeMenu === "management") return renderManagementContent();

    return null;
  };

  return (
    <div className={`min-h-screen flex ${theme.app}`}>
      <div
        className={`fixed top-4 right-4 z-60 transform transition-all duration-500 ${
          loginToast.show
            ? "translate-x-0 opacity-100"
            : "translate-x-8 opacity-0 pointer-events-none"
        }`}
      >
        <div className="rounded-2xl px-5 py-3 shadow-xl text-white min-w-75 text-center bg-emerald-500">
          {loginToast.message}
        </div>
      </div>

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
                onClick={() => {
                  setActiveMenu(item.key);
                  setShowManagementPanel(false);
                }}
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
                  onClick={() => {
                    setActiveMenu("management");
                    setActiveManagement(sub.key);
                    setShowManagementPanel(false);
                  }}
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
          onClick={() => navigate("/")}
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

            <div className="w-10 h-10 rounded-full bg-amber-900 text-white flex items-center justify-center font-bold cursor-pointer">
              D
            </div>
          </div>
        </div>

        {renderContent()}
      </main>
    </div>
  );
}
