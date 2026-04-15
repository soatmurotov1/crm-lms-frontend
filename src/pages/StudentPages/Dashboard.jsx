import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./StudentDashboard.css";
import {
  groupsApi,
  homeworkResponseApi,
  homeworkResultsApi,
  lessonVideosApi,
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
    key: "home",
    label: "Bosh sahifa",
    icon: (
      <svg
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    key: "groups",
    label: "Guruhlarim",
    icon: (
      <svg
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    key: "payments",
    label: "To'lovlarim",
    icon: (
      <svg
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
  },
  {
    key: "settings",
    label: "Sozlamalar",
    icon: (
      <svg
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c0 .64.38 1.22 1 1.51.44.2.93.23 1.4.09" />
      </svg>
    ),
  },
];

const pageTitles = {
  home: "Bosh sahifa",
  groups: "Guruhlarim",
  payments: "To'lovlarim",
  settings: "Sozlamalar",
};

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
  const cached = useMemo(() => readDashboardCache(), []);
  const notifButtonRef = useRef(null);
  const notifPanelRef = useRef(null);

  const [activePage, setActivePage] = useState(
    () => cached?.activePage || initialMenu || "home",
  );
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
  const [lessonDetailLoading, setLessonDetailLoading] = useState(false);
  const [lessonDetailError, setLessonDetailError] = useState("");
  const [lessonNote, setLessonNote] = useState("");
  const [lessonFile, setLessonFile] = useState(null);
  const [lessonSubmitError, setLessonSubmitError] = useState("");
  const [lessonSubmitting, setLessonSubmitting] = useState(false);
  const [notifications, setNotifications] = useState([]);
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

  const pagePathMap = {
    home: "/student/dashboard",
    groups: "/student/groups",
    payments: "/student/payments",
    settings: "/student/settings",
  };

  const routePage = useMemo(() => {
    if (location.pathname.startsWith("/student/groups")) return "groups";
    if (location.pathname.startsWith("/student/payments")) return "payments";
    if (location.pathname.startsWith("/student/settings")) return "settings";
    return "home";
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

  const notificationsWithReadState = useMemo(
    () =>
      notifications.map((item) => ({
        ...item,
        isRead: Boolean(notificationReadMap[item.id]),
        timeLabel: item.createdAt ? formatDateTime(item.createdAt) : "",
      })),
    [notifications, notificationReadMap],
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
    setLessonNote("");
    setLessonFile(null);
    setLessonSubmitError("");
    setLessonDetailError("");
    setLessonDetailLoading(true);

    if (!options.skipUrl && selectedGroup?.id && item?.lesson?.id) {
      const params = new URLSearchParams();
      params.set("groupId", String(selectedGroup.id));
      params.set("lessonId", String(item.lesson.id));
      navigate(`/student/groups?${params.toString()}`);
    }

    try {
      const [videosResult, homeworkResult] = await Promise.all([
        lessonVideosApi.getByGroup(selectedGroup.id),
        studentsApi.getMyGroupHomework(selectedGroup.id, item.lesson.id),
      ]);

      const videos = Array.isArray(videosResult?.data) ? videosResult.data : [];
      const filteredVideos = videos.filter((video) => {
        const lessonId = video.lesson?.id || video.lessonId;
        return lessonId === item.lesson.id;
      });
      setLessonVideos(filteredVideos);

      const homework = homeworkResult?.data || homeworkResult || null;
      setLessonHomework(homework);

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
    setLessonNote("");
    setLessonFile(null);
    setLessonSubmitError("");
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

  const changeMonth = (offset) => {
    setCalendarMonth((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + offset, 1);
      setSelectedDate(new Date(next.getFullYear(), next.getMonth(), 1));
      return next;
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("crm_access_token");
    localStorage.removeItem(STORAGE_KEY);
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

  const markNotificationAsRead = (notificationId) => {
    if (!notificationId) return;
    setNotificationReadMap((prev) => {
      if (prev[notificationId]) return prev;
      const next = { ...prev, [notificationId]: true };
      writeNotificationReadMap(notificationScopeKey, next);
      return next;
    });
  };

  const markAllNotificationsAsRead = () => {
    if (notificationsWithReadState.length === 0) return;
    setNotificationReadMap((prev) => {
      const next = { ...prev };
      notificationsWithReadState.forEach((item) => {
        next[item.id] = true;
      });
      writeNotificationReadMap(notificationScopeKey, next);
      return next;
    });
  };

  const handleNotificationOpen = (item) => {
    markNotificationAsRead(item.id);
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

  const profileName = profile?.fullName || "Talaba";
  const profileEmail = profile?.email || "-";
  const primaryGroupName = groups[0]?.name || "-";
  const { firstName, lastName } = splitFullName(profile?.fullName);

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

  return (
    <div className="student-dashboard">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">🎓</div>
          <div className="logo-text">
            <span className="brand">NAJOT TA'LIM</span>
            <span className="beta">Beta</span>
          </div>
        </div>
        <nav>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`nav-item ${activePage === item.key ? "active" : ""}`}
              onClick={() => {
                setActivePage(item.key);
                if (item.key !== "groups") {
                  closeGroupDetails({ skipUrl: true });
                }
                navigate(pagePathMap[item.key] || "/student/dashboard");
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button
            type="button"
            className="nav-item logout"
            onClick={() => setShowLogoutModal(true)}
          >
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Chiqish
          </button>
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <div className="topbar-title">{pageTitles[activePage]}</div>
          <div className="topbar-right">
            <button
              type="button"
              className={`notif-btn ${unreadNotificationCount > 0 ? "has-unread" : ""}`}
              ref={notifButtonRef}
              onClick={() => setShowNotifications((prev) => !prev)}
              aria-label="Xabarlarni ochish"
            >
              <svg
                width="17"
                height="17"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              {unreadNotificationCount > 0 && (
                <div className="notif-badge">{unreadNotificationCount}</div>
              )}
            </button>
            {showNotifications && (
              <div className="notif-panel-wrap" ref={notifPanelRef}>
                <StudentNotificationsPanel
                  notifications={notificationsWithReadState}
                  unreadCount={unreadNotificationCount}
                  onOpenNotification={handleNotificationOpen}
                  onMarkAllRead={markAllNotificationsAsRead}
                />
              </div>
            )}
            <button
              type="button"
              className="avatar"
              onClick={() => setActivePage("settings")}
            >
              {getInitials(profileName)}
            </button>
          </div>
        </div>

        <div className="content">
          {dataError && <div className="no-lesson">{dataError}</div>}

          {activePage === "home" && (
            <StudentHome
              monthLabel={monthLabel}
              weekDays={WEEK_DAYS}
              calendarCells={calendarCells}
              onSelectDate={setSelectedDate}
              onChangeMonth={changeMonth}
              lessonTitle={lessonTitle}
              selectedLessons={selectedLessons}
              isLoading={isLoading}
            />
          )}

          {activePage === "groups" && !selectedGroup && (
            <StudentGroups
              activeTab={activeGroupTab}
              onTabChange={setActiveGroupTab}
              activeGroups={formattedActiveGroups}
              completedGroups={formattedCompletedGroups}
              isLoading={isLoading}
              onSelectGroup={openGroupDetails}
            />
          )}

          {activePage === "groups" && selectedGroup && selectedLesson && (
            <StudentLessonDetail
              groupName={selectedGroup.name}
              lessonItem={selectedLesson}
              videos={lessonVideos}
              homework={lessonHomework}
              response={lessonResponse}
              result={lessonResult}
              status={lessonDetailStatus}
              isSubmissionExpired={isSubmissionExpired}
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
              getStatusLabel={getHomeworkStatusLabel}
              getStatusTone={getHomeworkStatusTone}
              formatDate={formatShortDate}
              formatDateTime={formatDateTime}
              getDeadline={getHomeworkDeadline}
              getVideoName={getVideoName}
            />
          )}

          {activePage === "groups" && selectedGroup && !selectedLesson && (
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
          )}

          {activePage === "payments" && (
            <StudentPayments
              stats={paymentStats}
              payments={paymentRows}
              isLoading={isLoading}
              dateLabel={paymentDateLabel}
              getStatusLabel={getPaymentStatusLabel}
            />
          )}

          {activePage === "settings" && (
            <StudentSettings
              profileName={profileName}
              profileEmail={profileEmail}
              profile={profile}
              primaryGroupName={primaryGroupName}
              firstName={firstName}
              lastName={lastName}
              onOpenPassword={() => setShowPasswordModal(true)}
              formatDate={formatShortDate}
              getInitials={getInitials}
            />
          )}
        </div>
      </div>

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
  );
}
