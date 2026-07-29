import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./StudentDashboard.css";
import {
  groupsApi,
  examsApi,
  gradesApi,
  homeworkResponseApi,
  homeworkResultsApi,
  lessonVideosApi,
  notificationsApi,
  paymentsApi,
  studentsApi,
} from "../../api/crmApi";
import StudentHome from "./components/StudentHome";
import StudentGroups from "./components/StudentGroups";
import StudentGroupDetails from "./components/StudentGroupDetails";
import StudentLessonDetail from "./components/StudentLessonDetail";
import StudentPayments from "./components/StudentPayments";
import StudentSettings from "./components/StudentSettings";
import LogoutModal from "./components/LogoutModal";
import PasswordModal from "./components/PasswordModal";
import StudentNotificationsPanel from "./components/StudentNotificationsPanel";
import PanelLayout from "../../components/layout/PanelLayout";
import StatCard from "../../components/ui/StatCard";
import ListCard from "../../components/ui/ListCard";
import PlaceholderSection from "../../components/ui/PlaceholderSection";
import { useTheme } from "../../theme/themeContext";
import {
  clearAuthSession,
  getAuthUserFromStorage,
} from "../../utils/authToken";
import {
  DAY_INDEX_TO_ENUM,
  WEEK_DAYS,
  formatDateTime,
  formatMonthLabel,
  formatShortDate,
  getHomeworkStatusLabel,
  getHomeworkStatusTone,
  getInitials,
  normalizeHomeworkStatus,
} from "./studentDashboardUtils";

const NAV_ITEMS = [
  {
    key: "dashboard",
    label: "Boshqaruv paneli",
    shortLabel: "Asosiy",
    icon: "🏠",
  },
  { key: "schedule", label: "Dars jadvali", shortLabel: "Jadval", icon: "🗓️" },
  {
    key: "lessons",
    label: "Mening darslarim",
    shortLabel: "Darslar",
    icon: "📖",
  },
  {
    key: "groups",
    label: "Mening guruhlarim",
    shortLabel: "Guruhlar",
    icon: "📚",
  },
  { key: "homework", label: "Uy vazifalar", icon: "📝" },
  { key: "exams", label: "Testlar", icon: "🧪" },
  { key: "grades", label: "Baholarim", icon: "⭐" },
  { key: "attendance", label: "Davomat", icon: "✅" },
  { key: "notifications", label: "Xabarnomalar", icon: "🔔" },
  { key: "profile", label: "Profilim", icon: "👤" },
  { key: "payments", label: "To'lovlarim", icon: "💳" },
];

const pageTitles = Object.fromEntries(
  NAV_ITEMS.map((item) => [item.key, item.label]),
);

// Eski route'lardagi kalitlar yangi menyuga moslashtiriladi.
const LEGACY_PAGE_MAP = {
  home: "dashboard",
  settings: "profile",
};

// Guruh tanlab, dars ro'yxatini ochadigan bo'limlar.
const GROUP_BASED_PAGES = ["groups", "lessons", "homework", "exams", "grades"];

const normalizeWeekDays = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const splitFullName = (value) => {
  if (!value) return { firstName: "", lastName: "" };
  const parts = String(value).trim().split(/\s+/);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
};

const formatMoney = (value) => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("uz-UZ").format(amount);
};

const GRADE_TYPE_LABELS = {
  LESSON: "Dars",
  HOMEWORK: "Uy vazifa",
  EXAM: "Imtihon",
  BEHAVIOR: "Xulq",
  OTHER: "Baho",
};

const getGradeTypeLabel = (type) => GRADE_TYPE_LABELS[type] || "Baho";

const getGradeTone = (grade) => {
  const percent = (Number(grade?.score || 0) / (grade?.maxScore || 100)) * 100;
  if (percent >= 85) return "emerald";
  if (percent >= 60) return "amber";
  return "rose";
};

const getVideoName = (video) => {
  const file = String(video?.file || "");
  const parts = file.split("/");
  const name = parts[parts.length - 1] || "";
  return name || "Video";
};

const getPaymentStatusLabel = (status) => {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "PAID") return "To'langan";
  if (normalized === "PENDING") return "Kutilmoqda";
  if (normalized === "DEBT") return "Qoldiq";
  return "Qoldiq";
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

const STORAGE_KEY = "crm_student_dashboard_cache_v1";
const NOTIFICATION_READ_KEY = "crm_student_notifications_read_v1";

const getNotificationReadStorageKey = (scope = "guest") =>
  `${NOTIFICATION_READ_KEY}:${scope}`;

const readNotificationReadMap = (scope = "guest") => {
  try {
    const raw = localStorage.getItem(getNotificationReadStorageKey(scope));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
};

const writeNotificationReadMap = (scope = "guest", value = {}) => {
  try {
    localStorage.setItem(
      getNotificationReadStorageKey(scope),
      JSON.stringify(value || {}),
    );
  } catch {}
};

const toTimeValue = (value) => {
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
};

const buildStablePaymentNotificationId = (payment) => {
  if (payment?.id) return `payment:${payment.id}`;
  if (payment?.paymentId) return `payment:${payment.paymentId}`;

  const groupId = payment?.groupId || payment?.group?.id || "nogroup";
  const amount = Number(payment?.amount || 0);
  const createdAt =
    payment?.created_at || payment?.updated_at || payment?.createdAt || "";
  const lessonMonth = payment?.month || "";
  const lessonYear = payment?.year || "";

  return `payment:fallback:${groupId}:${amount}:${createdAt}:${lessonYear}:${lessonMonth}`;
};

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

const parseDate = (value, fallback) => {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed;
};

const toIso = (value) => {
  if (!(value instanceof Date)) return null;
  if (Number.isNaN(value.getTime())) return null;
  return value.toISOString();
};

const startOfDay = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const buildCalendarDays = (monthDate) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
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

const validatePassword = (form) => {
  const errors = {};
  if (!form.current) {
    errors.current = "Amaldagi parolni kiriting";
  }
  if (!form.next) {
    errors.next = "Yangi parolni kiriting";
  } else if (String(form.next).length < 8) {
    errors.next = "Parol kamida 8 ta belgidan iborat bo'lsin";
  }
  if (!form.confirm) {
    errors.confirm = "Parolni tasdiqlang";
  } else if (form.confirm !== form.next) {
    errors.confirm = "Parollar mos emas";
  }
  return errors;
};

export default function StudentDashboardPage({ initialMenu = "home" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, theme } = useTheme();
  const cached = useMemo(() => readDashboardCache(), []);
  const notifButtonRef = useRef(null);
  const notifPanelRef = useRef(null);

  const [activePage, setActivePage] = useState(() => {
    const key = cached?.activePage || initialMenu || "dashboard";
    return LEGACY_PAGE_MAP[key] || key;
  });
  const [activeGroupTab, setActiveGroupTab] = useState(
    () => cached?.activeGroupTab || "active",
  );
  const [profile, setProfile] = useState(() => cached?.profile || null);
  const [groups, setGroups] = useState(() =>
    Array.isArray(cached?.groups) ? cached.groups : [],
  );
  const [payments, setPayments] = useState(() =>
    Array.isArray(cached?.payments) ? cached.payments : [],
  );
  const [paymentsMonth] = useState(() =>
    parseDate(cached?.paymentsMonth, new Date()),
  );
  const [isLoading, setIsLoading] = useState(
    () => !(cached?.profile || cached?.groups),
  );
  const [dataError, setDataError] = useState("");

  const [calendarMonth, setCalendarMonth] = useState(() =>
    parseDate(cached?.calendarMonth, new Date()),
  );
  const [selectedDate, setSelectedDate] = useState(() =>
    parseDate(cached?.selectedDate, new Date()),
  );

  const [selectedGroup, setSelectedGroup] = useState(
    () => cached?.selectedGroup || null,
  );
  const [groupLessons, setGroupLessons] = useState(() =>
    Array.isArray(cached?.groupLessons) ? cached.groupLessons : [],
  );
  const [groupLessonsLoading, setGroupLessonsLoading] = useState(false);
  const [groupLessonsError, setGroupLessonsError] = useState("");
  const [homeworkFilter, setHomeworkFilter] = useState(
    () => cached?.homeworkFilter || "ALL",
  );
  const [selectedLesson, setSelectedLesson] = useState(
    () => cached?.selectedLesson || null,
  );
  const [lessonVideos, setLessonVideos] = useState(() =>
    Array.isArray(cached?.lessonVideos) ? cached.lessonVideos : [],
  );
  const [lessonHomework, setLessonHomework] = useState(
    () => cached?.lessonHomework || null,
  );
  const [lessonResponse, setLessonResponse] = useState(
    () => cached?.lessonResponse || null,
  );
  const [lessonResult, setLessonResult] = useState(
    () => cached?.lessonResult || null,
  );
  const [lessonExam, setLessonExam] = useState(
    () => cached?.lessonExam || null,
  );
  const [lessonExamResponse, setLessonExamResponse] = useState(
    () => cached?.lessonExamResponse || null,
  );
  const [lessonDetailLoading, setLessonDetailLoading] = useState(false);
  const [lessonDetailError, setLessonDetailError] = useState("");
  const [lessonNote, setLessonNote] = useState("");
  const [lessonFile, setLessonFile] = useState(null);
  const [lessonSubmitError, setLessonSubmitError] = useState("");
  const [lessonSubmitting, setLessonSubmitting] = useState(false);
  const [lessonExamNote, setLessonExamNote] = useState("");
  const [lessonExamFile, setLessonExamFile] = useState(null);
  const [lessonExamSubmitError, setLessonExamSubmitError] = useState("");
  const [lessonExamSubmitting, setLessonExamSubmitting] = useState(false);
  const [myGrades, setMyGrades] = useState([]);
  const [myGradesStats, setMyGradesStats] = useState({
    average: 0,
    averagePercent: 0,
  });
  const [myGradesLoading, setMyGradesLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [serverNotifications, setServerNotifications] = useState([]);
  const [notificationReadMap, setNotificationReadMap] = useState({});
  const [showNotifications, setShowNotifications] = useState(false);

  const notificationScopeKey = useMemo(
    () => (profile?.id ? `student:${profile.id}` : "guest"),
    [profile?.id],
  );

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [showPassword, setShowPassword] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [passwordSaving, setPasswordSaving] = useState(false);

  const isExamSubmissionExpired = useMemo(() => {
    if (!lessonExam?.startAt || !lessonExam?.endAt) return false;
    const now = Date.now();
    const startAt = new Date(lessonExam.startAt).getTime();
    const endAt = new Date(lessonExam.endAt).getTime();
    if (Number.isNaN(startAt) || Number.isNaN(endAt)) return false;
    return now < startAt || now > endAt;
  }, [lessonExam]);

  const pagePathMap = {
    dashboard: "/student/dashboard",
    schedule: "/student/schedule",
    lessons: "/student/lessons",
    groups: "/student/groups",
    homework: "/student/homework",
    exams: "/student/exams",
    grades: "/student/grades",
    attendance: "/student/attendance",
    notifications: "/student/notifications",
    profile: "/student/settings",
    payments: "/student/payments",
  };

  const routePage = useMemo(() => {
    const path = location.pathname;
    const match = Object.entries(pagePathMap).find(
      ([key, value]) => key !== "dashboard" && path.startsWith(value),
    );

    return match ? match[0] : "dashboard";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const urlGroupId = Number(searchParams.get("groupId") || 0);
  const urlLessonId = Number(searchParams.get("lessonId") || 0);

  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setIsLoading(true);
      setDataError("");
      try {
        const [profileResult, groupsResult] = await Promise.all([
          studentsApi.getMyProfile(),
          groupsApi.getAll("ALL"),
        ]);
        if (!isMounted) return;
        setProfile(profileResult?.data || profileResult || null);
        setGroups(Array.isArray(groupsResult?.data) ? groupsResult.data : []);
      } catch {
        if (isMounted) {
          setDataError("Ma'lumotlarni yuklab bo'lmadi");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (routePage !== activePage) {
      setActivePage(routePage);
    }
  }, [routePage, activePage]);

  useEffect(() => {
    let isMounted = true;
    const loadPayments = async () => {
      if (!profile?.id) return;
      try {
        const result = await paymentsApi.getStudentMonthly(profile.id, {
          year: paymentsMonth.getFullYear(),
          month: paymentsMonth.getMonth() + 1,
        });
        if (!isMounted) return;
        const list = Array.isArray(result)
          ? result
          : Array.isArray(result?.data)
            ? result.data
            : [];
        setPayments(list);
      } catch {
        if (isMounted) {
          setPayments([]);
        }
      }
    };

    loadPayments();
    return () => {
      isMounted = false;
    };
  }, [profile?.id, paymentsMonth]);

  useEffect(() => {
    if (routePage !== "groups") return;
    if (!urlGroupId) {
      if (selectedGroup) closeGroupDetails();
      return;
    }

    const nextGroup = groups.find(
      (group) => Number(group.id) === Number(urlGroupId),
    );
    if (!nextGroup) return;
    if (!selectedGroup || Number(selectedGroup.id) !== Number(urlGroupId)) {
      openGroupDetails(nextGroup, { skipUrl: true });
    }
  }, [routePage, urlGroupId, groups]);

  useEffect(() => {
    if (routePage !== "groups" || !urlGroupId) return;
    if (!urlLessonId) {
      if (selectedLesson) closeLessonDetail();
      return;
    }

    const targetLesson = groupLessons.find(
      (item) => Number(item.lesson?.id) === Number(urlLessonId),
    );
    if (!targetLesson) return;
    if (!selectedLesson || Number(selectedLesson.lesson?.id) !== urlLessonId) {
      openLessonDetail(targetLesson, { skipUrl: true });
    }
  }, [routePage, urlGroupId, urlLessonId, groupLessons]);

  const monthLabel = useMemo(
    () => formatMonthLabel(calendarMonth),
    [calendarMonth],
  );

  const calendarDays = useMemo(
    () => buildCalendarDays(calendarMonth),
    [calendarMonth],
  );

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

  const selectedLessons = useMemo(() => {
    const key = toDateKey(selectedDate);
    return lessonsByDate[key] || [];
  }, [lessonsByDate, selectedDate]);

  const lessonTitle = useMemo(() => {
    if (isSameDay(selectedDate, today)) return "Bugungi darslar";
    return `${formatShortDate(selectedDate)} darslari`;
  }, [selectedDate, today]);

  const paymentTotals = useMemo(
    () =>
      payments.reduce(
        (acc, payment) => {
          const amount = Number(payment.amount || 0);
          const status = String(payment.status || "").toUpperCase();
          if (status === "PAID") {
            acc.paid += amount;
          } else {
            acc.due += amount;
          }
          acc.total += amount;
          return acc;
        },
        { total: 0, paid: 0, due: 0 },
      ),
    [payments],
  );

  const paymentStats = [
    {
      label: "Jami to'lov",
      value: formatMoney(paymentTotals.total),
      tone: "default",
    },
    {
      label: "To'langan",
      value: formatMoney(paymentTotals.paid),
      tone: "green",
    },
    {
      label: "Qoldiq",
      value: formatMoney(paymentTotals.due),
      tone: "red",
    },
  ];

  const paymentDateLabel = useMemo(() => {
    const date = new Date(
      paymentsMonth.getFullYear(),
      paymentsMonth.getMonth(),
      1,
    );
    return formatShortDate(date);
  }, [paymentsMonth]);

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

  const activeGroups = useMemo(
    () =>
      groups.filter(
        (group) => String(group.status || "ACTIVE").toUpperCase() === "ACTIVE",
      ),
    [groups],
  );

  const completedGroups = useMemo(
    () =>
      groups.filter(
        (group) => String(group.status || "ACTIVE").toUpperCase() !== "ACTIVE",
      ),
    [groups],
  );

  const formattedActiveGroups = useMemo(
    () =>
      activeGroups.map((group) => ({
        ...group,
        teacherInitials: getInitials(group.teacher?.fullName),
        startDateLabel: formatShortDate(group.startDate),
      })),
    [activeGroups],
  );

  const formattedCompletedGroups = useMemo(
    () =>
      completedGroups.map((group) => ({
        ...group,
        teacherInitials: getInitials(group.teacher?.fullName),
        startDateLabel: formatShortDate(group.startDate),
      })),
    [completedGroups],
  );

  const paymentRows = useMemo(
    () =>
      payments.map((payment) => ({
        ...payment,
        amountLabel: formatMoney(payment.amount),
      })),
    [payments],
  );

  // Serverdagi xabarnomalar (admin/o'qituvchi yuborganlari) va darslardan
  // hisoblanadigan mahalliy xabarlar bitta ro'yxatga birlashtiriladi.
  const mergedNotifications = useMemo(() => {
    const serverItems = serverNotifications.map((item) => ({
      id: `server:${item.id}`,
      serverId: item.id,
      serverIsRead: Boolean(item.isRead),
      type: item.type || "INFO",
      title: item.title,
      message: item.message,
      createdAt: item.created_at,
      groupId: item.groupId || null,
    }));

    return [...serverItems, ...notifications].sort((a, b) => {
      const timeDiff = toTimeValue(b.createdAt) - toTimeValue(a.createdAt);
      if (timeDiff !== 0) return timeDiff;
      return String(b.id || "").localeCompare(String(a.id || ""));
    });
  }, [serverNotifications, notifications]);

  const notificationsWithReadState = useMemo(
    () =>
      mergedNotifications.map((item) => ({
        ...item,
        isRead: item.serverId
          ? item.serverIsRead
          : Boolean(notificationReadMap[item.id]),
        timeLabel: item.createdAt ? formatDateTime(item.createdAt) : "",
      })),
    [mergedNotifications, notificationReadMap],
  );

  const unreadNotificationCount = useMemo(
    () =>
      notificationsWithReadState.reduce(
        (count, item) => count + (item.isRead ? 0 : 1),
        0,
      ),
    [notificationsWithReadState],
  );

  const getHomeworkDeadline = (homework) => {
    if (!homework?.created_at || !homework?.durationTime) return "-";
    const start = new Date(homework.created_at);
    const hours = Number(homework.durationTime || 0);
    if (!Number.isFinite(hours) || hours <= 0) return "-";
    const deadline = new Date(start.getTime() + hours * 60 * 60 * 1000);
    return formatDateTime(deadline);
  };

  const filteredGroupLessons = useMemo(() => {
    if (homeworkFilter === "ALL") return groupLessons;
    return groupLessons.filter((item) => item.status === homeworkFilter);
  }, [groupLessons, homeworkFilter]);

  const lessonDetailStatus = useMemo(() => {
    if (!lessonHomework) return "NOT_ASSIGNED";
    if (lessonResult?.status)
      return normalizeHomeworkStatus(lessonResult.status);
    if (lessonResponse) return "PENDING";
    return "NOT_DONE";
  }, [lessonHomework, lessonResult, lessonResponse]);

  const isSubmissionExpired = useMemo(() => {
    if (!lessonHomework?.created_at) return false;
    const createdAt = new Date(lessonHomework.created_at).getTime();
    if (Number.isNaN(createdAt)) return false;
    return Date.now() - createdAt > 24 * 60 * 60 * 1000;
  }, [lessonHomework]);

  const updateGroupLessonStatus = (lessonId, status) => {
    setGroupLessons((prev) =>
      prev.map((item) =>
        item.lesson.id === lessonId ? { ...item, status } : item,
      ),
    );
  };

  const openGroupDetails = async (group, options = {}) => {
    setSelectedGroup(group);
    setSelectedLesson(null);
    setActivePage("groups");
    setHomeworkFilter("ALL");
    setGroupLessons([]);
    setGroupLessonsError("");
    setGroupLessonsLoading(true);

    if (!options.skipUrl && group?.id) {
      const params = new URLSearchParams();
      params.set("groupId", String(group.id));
      navigate(`/student/groups?${params.toString()}`);
    }

    try {
      const [lessonsResult, videosResult] = await Promise.all([
        groupsApi.getLessonsByGroup(group.id),
        studentsApi.getMyGroupLessonVideo(group.id),
      ]);
      const lessons = Array.isArray(lessonsResult?.data)
        ? lessonsResult.data
        : [];
      const videos = Array.isArray(videosResult?.data) ? videosResult.data : [];

      const videoCountMap = new Map();
      videos.forEach((video) => {
        const lessonId = video.lesson?.id || video.lessonId;
        if (!lessonId) return;
        videoCountMap.set(lessonId, (videoCountMap.get(lessonId) || 0) + 1);
      });

      const homeworkList = await Promise.all(
        lessons.map(async (lesson) => {
          try {
            const result = await studentsApi.getMyGroupHomework(
              group.id,
              lesson.id,
            );
            return result?.data || result || null;
          } catch {
            return null;
          }
        }),
      );

      const items = lessons.map((lesson, index) => {
        const homework = homeworkList[index];
        const status = homework
          ? normalizeHomeworkStatus(homework.status)
          : "NOT_ASSIGNED";
        const lessonDate = lesson.created_at || lesson.date || lesson.startDate;
        return {
          lesson,
          status,
          homework,
          videoCount: videoCountMap.get(lesson.id) || 0,
          lessonDate,
        };
      });

      const sortedItems = [...items].sort((a, b) => {
        const aTime = a.lessonDate ? new Date(a.lessonDate).getTime() : 0;
        const bTime = b.lessonDate ? new Date(b.lessonDate).getTime() : 0;
        if (aTime !== bTime) return bTime - aTime;
        return Number(b.lesson?.id || 0) - Number(a.lesson?.id || 0);
      });

      setGroupLessons(sortedItems);
    } catch {
      setGroupLessonsError("Darslarni yuklab bo'lmadi");
    } finally {
      setGroupLessonsLoading(false);
    }
  };

  const openLessonDetail = async (item, options = {}) => {
    if (!selectedGroup) return;
    setSelectedLesson(item);
    setLessonVideos([]);
    setLessonHomework(null);
    setLessonResponse(null);
    setLessonResult(null);
    setLessonExam(null);
    setLessonExamResponse(null);
    setLessonNote("");
    setLessonFile(null);
    setLessonSubmitError("");
    setLessonExamNote("");
    setLessonExamFile(null);
    setLessonExamSubmitError("");
    setLessonDetailError("");
    setLessonDetailLoading(true);

    if (!options.skipUrl && selectedGroup?.id && item?.lesson?.id) {
      const params = new URLSearchParams();
      params.set("groupId", String(selectedGroup.id));
      params.set("lessonId", String(item.lesson.id));
      navigate(`/student/groups?${params.toString()}`);
    }

    try {
      const [videosResult, homeworkResult, examsResult] = await Promise.all([
        lessonVideosApi.getByGroup(selectedGroup.id),
        studentsApi.getMyGroupHomework(selectedGroup.id, item.lesson.id),
        examsApi.getByGroup(selectedGroup.id),
      ]);

      const videos = Array.isArray(videosResult?.data) ? videosResult.data : [];
      const filteredVideos = videos.filter((video) => {
        const lessonId = video.lesson?.id || video.lessonId;
        return lessonId === item.lesson.id;
      });
      setLessonVideos(filteredVideos);

      const homework = homeworkResult?.data || homeworkResult || null;
      setLessonHomework(homework);

      const examList = Array.isArray(examsResult?.data) ? examsResult.data : [];
      const exam = examList.find(
        (record) => Number(record.lessonId) === Number(item.lesson.id),
      );
      setLessonExam(exam || null);

      if (homework?.id) {
        try {
          const responseResult = await homeworkResponseApi.getMine(homework.id);
          setLessonResponse(responseResult?.data ?? null);
        } catch {
          setLessonResponse(null);
        }

        try {
          const result = await homeworkResultsApi.getMine(homework.id);
          setLessonResult(result?.data ?? null);
          if (result?.data?.status) {
            updateGroupLessonStatus(
              item.lesson.id,
              normalizeHomeworkStatus(result.data.status),
            );
          }
        } catch {
          setLessonResult(null);
        }
      }

      if (exam?.id) {
        try {
          const responseResult = await examsApi.getMyResponse(exam.id);
          setLessonExamResponse(responseResult?.data ?? null);
        } catch {
          setLessonExamResponse(null);
        }
      }
    } catch {
      setLessonDetailError("Dars ma'lumotlarini yuklab bo'lmadi");
    } finally {
      setLessonDetailLoading(false);
    }
  };

  const closeLessonDetail = (options = {}) => {
    setSelectedLesson(null);
    setLessonVideos([]);
    setLessonHomework(null);
    setLessonResponse(null);
    setLessonResult(null);
    setLessonExam(null);
    setLessonExamResponse(null);
    setLessonNote("");
    setLessonFile(null);
    setLessonSubmitError("");
    setLessonExamNote("");
    setLessonExamFile(null);
    setLessonExamSubmitError("");
    setLessonDetailError("");

    if (!options.skipUrl && selectedGroup?.id) {
      const params = new URLSearchParams();
      params.set("groupId", String(selectedGroup.id));
      navigate(`/student/groups?${params.toString()}`, { replace: true });
    }
  };

  const closeGroupDetails = (options = {}) => {
    setSelectedGroup(null);
    setGroupLessons([]);
    setGroupLessonsError("");
    setHomeworkFilter("ALL");
    closeLessonDetail({ skipUrl: true });
    if (!options.skipUrl) {
      navigate("/student/groups", { replace: true });
    }
  };

  const handleHomeworkSubmit = async () => {
    if (!lessonHomework) return;
    if (isSubmissionExpired) {
      setLessonSubmitError("Uyga vazifa muddati tugagan");
      return;
    }
    if (!lessonNote.trim()) {
      setLessonSubmitError("Izoh kiriting");
      return;
    }

    setLessonSubmitting(true);
    setLessonSubmitError("");
    try {
      await homeworkResponseApi.create({
        title: lessonNote.trim(),
        homeworkId: lessonHomework.id,
        file: lessonFile || undefined,
      });

      const responseResult = await homeworkResponseApi.getMine(
        lessonHomework.id,
      );
      setLessonResponse(responseResult?.data || responseResult || null);
      updateGroupLessonStatus(selectedLesson.lesson.id, "PENDING");
    } catch (error) {
      setLessonSubmitError("Uyga vazifa yuborilmadi");
    } finally {
      setLessonSubmitting(false);
    }
  };

  const handleExamSubmit = async () => {
    if (!lessonExam) return;
    if (isExamSubmissionExpired) {
      setLessonExamSubmitError("Exam vaqti tugagan yoki hali boshlanmagan");
      return;
    }
    if (!lessonExamNote.trim() && !lessonExamFile) {
      setLessonExamSubmitError("Izoh yoki fayl kiritish kerak");
      return;
    }

    setLessonExamSubmitting(true);
    setLessonExamSubmitError("");
    try {
      const payload = {
        examId: lessonExam.id,
        comment: lessonExamNote.trim() || undefined,
        file: lessonExamFile || undefined,
      };

      if (lessonExamResponse?.id) {
        await examsApi.updateResponse(payload);
      } else {
        await examsApi.submitResponse(payload);
      }

      const responseResult = await examsApi.getMyResponse(lessonExam.id);
      setLessonExamResponse(responseResult?.data || responseResult || null);
    } catch {
      setLessonExamSubmitError("Exam yuborilmadi");
    } finally {
      setLessonExamSubmitting(false);
    }
  };

  const changeMonth = (offset) => {
    setCalendarMonth((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + offset, 1);
      setSelectedDate(new Date(next.getFullYear(), next.getMonth(), 1));
      return next;
    });
  };

  const handleLogout = () => {
    clearAuthSession();
    navigate("/", { replace: true });
  };

  const handlePasswordChange = (field, value) => {
    setPasswordForm((prev) => {
      const next = { ...prev, [field]: value };
      setPasswordErrors(validatePassword(next));
      return next;
    });
  };

  const handlePasswordSave = async () => {
    const errors = validatePassword(passwordForm);
    setPasswordErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setPasswordSaving(true);
    try {
      await studentsApi.changeMyPassword({
        oldPassword: passwordForm.current,
        newPassword: passwordForm.next,
      });
      setShowPasswordModal(false);
      setPasswordForm({ current: "", next: "", confirm: "" });
      setPasswordErrors({});
    } catch {
      setPasswordErrors((prev) => ({
        ...prev,
        current: "Parolni yangilab bo'lmadi",
      }));
    } finally {
      setPasswordSaving(false);
    }
  };

  const markNotificationAsRead = (notification) => {
    const notificationId =
      typeof notification === "object" ? notification?.id : notification;
    if (!notificationId) return;

    const serverId =
      typeof notification === "object" ? notification?.serverId : null;

    if (serverId) {
      setServerNotifications((prev) =>
        prev.map((item) =>
          item.id === serverId ? { ...item, isRead: true } : item,
        ),
      );
      notificationsApi.markAsRead(serverId).catch(() => {
        // Belgilash muvaffaqiyatsiz bo'lsa keyingi yangilanishda tiklanadi.
      });
      return;
    }

    setNotificationReadMap((prev) => {
      if (prev[notificationId]) return prev;
      const next = { ...prev, [notificationId]: true };
      writeNotificationReadMap(notificationScopeKey, next);
      return next;
    });
  };

  const markAllNotificationsAsRead = () => {
    if (notificationsWithReadState.length === 0) return;

    if (serverNotifications.some((item) => !item.isRead)) {
      setServerNotifications((prev) =>
        prev.map((item) => ({ ...item, isRead: true })),
      );
      notificationsApi.markAllAsRead().catch(() => {
        // Xatoda keyingi so'rovda haqiqiy holat qaytadi.
      });
    }

    setNotificationReadMap((prev) => {
      const next = { ...prev };
      notificationsWithReadState
        .filter((item) => !item.serverId)
        .forEach((item) => {
          next[item.id] = true;
        });
      writeNotificationReadMap(notificationScopeKey, next);
      return next;
    });
  };

  const handleNotificationOpen = (item) => {
    markNotificationAsRead(item);
    setShowNotifications(false);

    if (item.type === "PAYMENT_ACCEPTED") {
      setActivePage("payments");
      navigate("/student/payments");
      return;
    }

    if (!item.groupId) return;
    setActivePage("groups");
    const params = new URLSearchParams();
    params.set("groupId", String(item.groupId));
    if (item.lessonId) {
      params.set("lessonId", String(item.lessonId));
    }
    navigate(`/student/groups?${params.toString()}`);
  };

  const tokenUser = getAuthUserFromStorage();
  const profileName = profile?.fullName || tokenUser?.fullName || "Talaba";
  const profilePhone = profile?.phone || "-";
  const primaryGroupName = groups[0]?.name || "-";
  const { firstName, lastName } = splitFullName(profile?.fullName);

  const goToPage = (pageKey) => {
    setActivePage(pageKey);
    if (!GROUP_BASED_PAGES.includes(pageKey)) {
      closeGroupDetails({ skipUrl: true });
    }
    navigate(pagePathMap[pageKey] || "/student/dashboard");
  };

  const todayLessons = useMemo(
    () => lessonsByDate[toDateKey(new Date())] || [],
    [lessonsByDate],
  );

  // "Yutuqlarim" — mavjud ma'lumotlardan hisoblanadigan belgilar.
  const achievements = useMemo(() => {
    const items = [
      {
        id: "active",
        icon: "🎯",
        title: "Faol o'quvchi",
        meta: `${activeGroups.length} ta faol guruhdasiz`,
        earned: activeGroups.length > 0,
      },
      {
        id: "payments",
        icon: "💳",
        title: "Intizomli to'lovchi",
        meta:
          paymentTotals.due > 0
            ? `${formatMoney(paymentTotals.due)} so'm qoldiq bor`
            : "Joriy oy to'lovi yopilgan",
        earned: paymentTotals.due === 0 && paymentTotals.paid > 0,
      },
      {
        id: "schedule",
        icon: "🗓️",
        title: "Darsga tayyor",
        meta: todayLessons.length
          ? `Bugun ${todayLessons.length} ta dars`
          : "Bugun dars yo'q",
        earned: todayLessons.length > 0,
      },
      {
        id: "finished",
        icon: "🏁",
        title: "Kursni tamomlagan",
        meta: `${completedGroups.length} ta guruh yakunlangan`,
        earned: completedGroups.length > 0,
      },
    ];

    return items.map((item) => ({
      id: item.id,
      icon: item.icon,
      title: item.title,
      meta: item.meta,
      badge: item.earned ? "Olindi" : "Hali yo'q",
      tone: item.earned ? "emerald" : "slate",
    }));
  }, [
    activeGroups.length,
    completedGroups.length,
    paymentTotals.due,
    paymentTotals.paid,
    todayLessons.length,
  ]);

  // O'quvchi boshqa o'quvchilarning ma'lumotini ko'ra olmaydi, shuning uchun
  // bu yerda o'zining ko'rsatkichlari chiqadi.
  const myRanking = useMemo(
    () => [
      {
        id: "me",
        icon: "🎓",
        title: profileName,
        meta: `${activeGroups.length} faol guruh · ${completedGroups.length} yakunlangan`,
        badge: "Men",
        tone: "violet",
      },
      {
        id: "note",
        icon: "ℹ️",
        title: "Umumiy reyting",
        meta: "Guruhdoshlar reytingi hozircha yopiq",
        badge: "Tez orada",
        tone: "slate",
      },
    ],
    [profileName, activeGroups.length, completedGroups.length],
  );

  useEffect(() => {
    setNotificationReadMap(readNotificationReadMap(notificationScopeKey));
  }, [notificationScopeKey]);

  useEffect(() => {
    // Keep only keys relevant to currently loaded notifications to avoid stale leftovers.
    if (notifications.length === 0) return;

    setNotificationReadMap((prev) => {
      const next = {};
      notifications.forEach((item) => {
        if (!item?.id) return;
        if (prev[item.id]) next[item.id] = true;
      });

      const hasSameKeys =
        Object.keys(prev).length === Object.keys(next).length &&
        Object.keys(next).every((key) => prev[key] === next[key]);

      if (hasSameKeys) return prev;
      writeNotificationReadMap(notificationScopeKey, next);
      return next;
    });
  }, [notifications, notificationScopeKey]);

  useEffect(() => {
    writeDashboardCache({
      activePage,
      activeGroupTab,
      profile,
      groups,
      payments,
      paymentsMonth: toIso(paymentsMonth),
      calendarMonth: toIso(calendarMonth),
      selectedDate: toIso(selectedDate),
      selectedGroup,
      groupLessons,
      homeworkFilter,
      selectedLesson,
      lessonVideos,
      lessonHomework,
      lessonResponse,
      lessonResult,
    });
  }, [
    activePage,
    activeGroupTab,
    profile,
    groups,
    payments,
    paymentsMonth,
    calendarMonth,
    selectedDate,
    selectedGroup,
    groupLessons,
    homeworkFilter,
    selectedLesson,
    lessonVideos,
    lessonHomework,
    lessonResponse,
    lessonResult,
  ]);

  useEffect(() => {
    let isMounted = true;

    const loadMyGrades = async () => {
      try {
        setMyGradesLoading(true);
        const result = await gradesApi.getMine();
        if (!isMounted) return;

        setMyGrades(Array.isArray(result?.data) ? result.data : []);
        setMyGradesStats({
          average: result?.average || 0,
          averagePercent: result?.averagePercent || 0,
        });
      } catch {
        if (isMounted) {
          setMyGrades([]);
          setMyGradesStats({ average: 0, averagePercent: 0 });
        }
      } finally {
        if (isMounted) setMyGradesLoading(false);
      }
    };

    loadMyGrades();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadServerNotifications = async () => {
      try {
        const result = await notificationsApi.getMine(50);
        if (!isMounted) return;
        setServerNotifications(
          Array.isArray(result?.data) ? result.data : [],
        );
      } catch {
        if (isMounted) setServerNotifications([]);
      }
    };

    loadServerNotifications();
    const timerId = setInterval(loadServerNotifications, 60000);

    return () => {
      isMounted = false;
      clearInterval(timerId);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const buildNotifications = async () => {
      if (!profile?.id || groups.length === 0) {
        if (isMounted) setNotifications([]);
        return;
      }

      const items = [];

      for (const group of groups) {
        const groupId = Number(group?.id || 0);
        if (!groupId) continue;

        let lessons = [];
        try {
          const lessonResult = await studentsApi.getMyLessons(groupId);
          lessons = toArray(lessonResult);
        } catch {
          lessons = [];
        }

        for (const lesson of lessons) {
          const lessonId = Number(lesson?.id || lesson?.lessonId || 0);
          if (!lessonId) continue;

          const lessonTitle = lesson?.title || "Yangi dars";
          items.push({
            id: `lesson:${groupId}:${lessonId}`,
            type: "LESSON_CREATED",
            title: "Yangi dars qo'shildi",
            message: `${lessonTitle} mavzusi dars jadvaliga qo'shildi.`,
            createdAt:
              lesson?.created_at || lesson?.updated_at || lesson?.date || null,
            groupId,
            lessonId,
          });

          let homework = null;
          try {
            const homeworkResult = await studentsApi.getMyGroupHomework(
              groupId,
              lessonId,
            );
            homework = homeworkResult?.data || homeworkResult || null;
          } catch {
            homework = null;
          }

          if (!homework?.id) continue;

          items.push({
            id: `homework:${homework.id}`,
            type: "HOMEWORK_CREATED",
            title: "Uyga vazifa berildi",
            message: `${homework.title || "Yangi vazifa"} bo'yicha topshiriq berildi.`,
            createdAt:
              homework?.created_at ||
              homework?.updated_at ||
              lesson?.date ||
              null,
            groupId,
            lessonId,
          });

          try {
            const result = await homeworkResultsApi.getMine(homework.id);
            const review = result?.data || result || null;
            if (review?.id || review?.status) {
              items.push({
                id: `review:${homework.id}`,
                type: "HOMEWORK_REVIEWED",
                title: "Uyga vazifa tekshirildi",
                message:
                  "O'qituvchi topshirig'ingizni tekshirdi. Natijani ochib ko'ring.",
                createdAt:
                  review?.updated_at ||
                  review?.created_at ||
                  homework?.updated_at ||
                  null,
                groupId,
                lessonId,
              });
            }
          } catch {
            // Keep notifications usable even if a result is missing.
          }
        }
      }

      payments
        .filter(
          (payment) => String(payment?.status || "").toUpperCase() === "PAID",
        )
        .forEach((payment) => {
          const paymentId = buildStablePaymentNotificationId(payment);
          items.push({
            id: paymentId,
            type: "PAYMENT_ACCEPTED",
            title: "To'lov qabul qilindi",
            message: `${formatMoney(payment?.amount || 0)} so'm to'lovingiz muvaffaqiyatli qabul qilindi.`,
            createdAt:
              payment?.updated_at ||
              payment?.created_at ||
              new Date().toISOString(),
          });
        });

      const uniqueMap = new Map();
      items.forEach((item) => {
        if (!item?.id) return;
        const previous = uniqueMap.get(item.id);
        if (
          !previous ||
          toTimeValue(item.createdAt) > toTimeValue(previous.createdAt)
        ) {
          uniqueMap.set(item.id, item);
        }
      });

      const sorted = Array.from(uniqueMap.values()).sort((a, b) => {
        const timeDiff = toTimeValue(b.createdAt) - toTimeValue(a.createdAt);
        if (timeDiff !== 0) return timeDiff;
        return String(b.id || "").localeCompare(String(a.id || ""));
      });

      if (isMounted) {
        setNotifications(sorted);
      }
    };

    buildNotifications();
    const timerId = setInterval(buildNotifications, 60000);

    return () => {
      isMounted = false;
      clearInterval(timerId);
    };
  }, [profile?.id, groups, payments]);

  useEffect(() => {
    if (!showNotifications) return undefined;

    const handleOutsideClick = (event) => {
      const target = event.target;
      if (notifPanelRef.current?.contains(target)) return;
      if (notifButtonRef.current?.contains(target)) return;
      setShowNotifications(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showNotifications]);

  const openGroupFromList = (group) =>
    openGroupDetails(group, { skipUrl: activePage !== "groups" });

  const renderGroupsView = (hint) => {
    if (selectedGroup && selectedLesson) {
      return (
        <StudentLessonDetail
          groupName={selectedGroup.name}
          lessonItem={selectedLesson}
          videos={lessonVideos}
          homework={lessonHomework}
          response={lessonResponse}
          result={lessonResult}
          status={lessonDetailStatus}
          isSubmissionExpired={isSubmissionExpired}
          exam={lessonExam}
          examResponse={lessonExamResponse}
          isExamSubmissionExpired={isExamSubmissionExpired}
          examNote={lessonExamNote}
          examFile={lessonExamFile}
          examSubmitError={lessonExamSubmitError}
          examSubmitting={lessonExamSubmitting}
          isLoading={lessonDetailLoading}
          error={lessonDetailError}
          note={lessonNote}
          selectedFile={lessonFile}
          submitError={lessonSubmitError}
          submitting={lessonSubmitting}
          onBack={closeLessonDetail}
          onNoteChange={setLessonNote}
          onFileChange={setLessonFile}
          onSubmit={handleHomeworkSubmit}
          onExamNoteChange={setLessonExamNote}
          onExamFileChange={setLessonExamFile}
          onExamSubmit={handleExamSubmit}
          getStatusLabel={getHomeworkStatusLabel}
          getStatusTone={getHomeworkStatusTone}
          formatDate={formatShortDate}
          formatDateTime={formatDateTime}
          getDeadline={getHomeworkDeadline}
          getVideoName={getVideoName}
        />
      );
    }

    if (selectedGroup) {
      return (
        <StudentGroupDetails
          groupName={selectedGroup.name}
          lessons={filteredGroupLessons}
          isLoading={groupLessonsLoading}
          error={groupLessonsError}
          homeworkFilter={homeworkFilter}
          onFilterChange={setHomeworkFilter}
          onBack={closeGroupDetails}
          onSelectLesson={openLessonDetail}
          getStatusLabel={getHomeworkStatusLabel}
          getStatusTone={getHomeworkStatusTone}
          formatDate={formatShortDate}
          getDeadline={getHomeworkDeadline}
        />
      );
    }

    return (
      <>
        {hint && <p className={`text-sm mb-4 ${theme.soft}`}>{hint}</p>}
        <StudentGroups
          activeTab={activeGroupTab}
          onTabChange={setActiveGroupTab}
          activeGroups={formattedActiveGroups}
          completedGroups={formattedCompletedGroups}
          isLoading={isLoading}
          onSelectGroup={openGroupFromList}
        />
      </>
    );
  };

  const renderOverview = () => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatCard
          icon="📚"
          tone="violet"
          label="Faol guruhlarim"
          value={activeGroups.length}
        />
        <StatCard
          icon="🗓️"
          tone="blue"
          label="Bugungi darslar"
          value={todayLessons.length}
        />
        <StatCard
          icon="🏁"
          tone="emerald"
          label="Tugatilgan guruhlar"
          value={completedGroups.length}
        />
        <StatCard
          icon="💳"
          tone={paymentTotals.due > 0 ? "rose" : "emerald"}
          label="To'lov qoldig'i"
          value={formatMoney(paymentTotals.due)}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <ListCard
          title="Dars jadvali"
          subtitle={formatShortDate(new Date())}
          items={todayLessons.map((lesson) => ({
            id: lesson.id,
            title: lesson.title,
            meta: `${lesson.time} · ${lesson.room}`,
            badge: "Bugun",
            tone: "emerald",
            icon: "🕘",
          }))}
          loading={isLoading}
          emptyText="Bugun dars yo'q"
          action={
            <button
              type="button"
              onClick={() => goToPage("schedule")}
              className="text-sm font-medium text-violet-500"
            >
              To'liq jadval
            </button>
          }
          maxHeight={300}
        />

        <ListCard
          title="Yutuqlarim"
          subtitle="Joriy ma'lumotlar asosida hisoblanadi"
          items={achievements}
          maxHeight={300}
        />

        <ListCard
          title="Top o'quvchilar"
          subtitle="Mening ko'rsatkichlarim"
          items={myRanking}
          emptyText="Ma'lumot yo'q"
          maxHeight={300}
        />
      </div>
    </>
  );

  const renderContent = () => {
    if (activePage === "dashboard") return renderOverview();

    if (activePage === "schedule") {
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

    if (activePage === "groups") return renderGroupsView();

    if (activePage === "lessons") {
      return renderGroupsView(
        "Darslarni ko'rish uchun guruhni tanlang — har bir guruh darslari, video va materiallari ochiladi.",
      );
    }

    if (activePage === "homework") {
      return renderGroupsView(
        "Uy vazifalarni ko'rish uchun guruhni tanlang — dars ro'yxatida vazifa holati bo'yicha filtr bor.",
      );
    }

    if (activePage === "exams") {
      return renderGroupsView(
        "Testlar dars ichida joylashadi: guruhni, so'ng darsni oching — test mavjud bo'lsa shu yerda topshiriladi.",
      );
    }

    if (activePage === "grades") {
      return (
        <div className="space-y-5">
          <ListCard
            title="Baholarim"
            subtitle={
              myGrades.length > 0
                ? `O'rtacha ${myGradesStats.average} ball · ${myGradesStats.averagePercent}%`
                : "O'qituvchi qo'ygan baholar"
            }
            items={myGrades.map((grade) => ({
              id: grade.id,
              title: `${grade.score}/${grade.maxScore || 100} — ${
                grade.group?.name || "Guruh"
              }`,
              meta: `${grade.lesson?.title || getGradeTypeLabel(grade.type)} · ${formatDateTime(
                grade.date,
              )}${grade.comment ? ` · ${grade.comment}` : ""}`,
              badge: `${Math.round(
                (grade.score / (grade.maxScore || 100)) * 100,
              )}%`,
              tone: getGradeTone(grade),
              icon: "⭐",
            }))}
            loading={myGradesLoading}
            emptyText="Hozircha baho qo'yilmagan"
            maxHeight={400}
          />

          {renderGroupsView(
            "Uy vazifa natijalari: guruhni tanlang va dars ro'yxatidagi holatlarni ko'ring.",
          )}
        </div>
      );
    }

    if (activePage === "attendance") {
      return (
        <PlaceholderSection
          icon="✅"
          title="Davomat"
          description="Bu yerda darslarga qatnashuv tarixingiz chiqadi."
          points={[
            "Har bir dars uchun keldi / kelmadi belgisi",
            "Guruh bo'yicha davomat foizi",
            "Oylik davomat hisoboti",
          ]}
          note="Hozircha davomat ma'lumotini faqat o'qituvchi va admin ko'ra oladi — o'quvchi uchun backend'da endpoint yo'q."
        />
      );
    }

    if (activePage === "notifications") {
      return (
        <div className="max-w-2xl">
          <StudentNotificationsPanel
            notifications={notificationsWithReadState}
            unreadCount={unreadNotificationCount}
            onOpenNotification={handleNotificationOpen}
            onMarkAllRead={markAllNotificationsAsRead}
          />
        </div>
      );
    }

    if (activePage === "payments") {
      return (
        <StudentPayments
          stats={paymentStats}
          payments={paymentRows}
          isLoading={isLoading}
          dateLabel={paymentDateLabel}
          getStatusLabel={getPaymentStatusLabel}
        />
      );
    }

    if (activePage === "profile") {
      return (
        <StudentSettings
          profileName={profileName}
          profilePhone={profilePhone}
          profile={profile}
          primaryGroupName={primaryGroupName}
          firstName={firstName}
          lastName={lastName}
          onOpenPassword={() => setShowPasswordModal(true)}
          formatDate={formatShortDate}
          getInitials={getInitials}
          darkMode={darkMode}
        />
      );
    }

    return null;
  };

  return (
    <PanelLayout
      brand="EduCenter"
      menuItems={NAV_ITEMS}
      activeKey={activePage}
      onSelect={goToPage}
      greeting={`Xush kelibsiz, ${profileName}`}
      subtitle={pageTitles[activePage]}
      user={profile}
      roleLabel="STUDENT"
      onLogout={() => setShowLogoutModal(true)}
      headerActions={
        <div className="relative">
          <button
            type="button"
            ref={notifButtonRef}
            onClick={() => setShowNotifications((prev) => !prev)}
            className={`relative w-10 h-10 flex items-center justify-center rounded-xl border cursor-pointer ${theme.topBtn}`}
            aria-label="Xabarlarni ochish"
          >
            🔔
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadNotificationCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div
              ref={notifPanelRef}
              className="absolute right-0 top-12 z-50 w-80"
            >
              <StudentNotificationsPanel
                notifications={notificationsWithReadState}
                unreadCount={unreadNotificationCount}
                onOpenNotification={handleNotificationOpen}
                onMarkAllRead={markAllNotificationsAsRead}
              />
            </div>
          )}
        </div>
      }
    >
      <div className={`student-scope${darkMode ? " dark" : ""}`}>
        {dataError && <div className="no-lesson">{dataError}</div>}
        {renderContent()}
      </div>

      {/*
        Modal ranglari `student-scope` dagi CSS o'zgaruvchilaridan keladi.
        Shu o'ram tashqarisida qolsa, `--card-bg` sukut bo'yicha oq bo'lib,
        tungi rejimda modal oq fonli chiqadi.
      */}
      <div className={`student-scope${darkMode ? " dark" : ""}`}>
        {showLogoutModal && (
          <LogoutModal
            onClose={() => setShowLogoutModal(false)}
            onConfirm={handleLogout}
          />
        )}

        {showPasswordModal && (
          <PasswordModal
            form={passwordForm}
            errors={passwordErrors}
            showPassword={showPassword}
            onClose={() => setShowPasswordModal(false)}
            onChange={handlePasswordChange}
            onToggle={(field) =>
              setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }))
            }
            onSubmit={handlePasswordSave}
            saving={passwordSaving}
          />
        )}
      </div>
    </PanelLayout>
  );
}
