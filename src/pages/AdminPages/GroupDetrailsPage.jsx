import { useEffect, useMemo, useRef, useState } from "react";
import HomeworkDetailPage from "./HomeworkDetailPage";
import {
  attendanceApi,
  groupsApi,
  homeworkApi,
  lessonsApi,
  lessonVideosApi,
  studentGroupApi,
  studentsApi,
  teachersApi,
} from "../../api/crmApi";
import {
  defaultTeachers,
  getInitial,
  lessonDateLabel,
  makeDateHeaders,
} from "./group-details/constants";

export default function GroupDetailsPage({
  theme = {
    card: "bg-white",
    text: "text-slate-900",
    soft: "text-slate-500",
    chip: "bg-slate-50 text-slate-700 border-slate-200",
    rowBorder: "border-slate-200",
  },
  darkMode = false,
  group,
  onBack,
}) {
  const normalizeDays = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  };

  const normalizeGroup = (incomingGroup) => {
    const fallback = {
      name: "Bootcamp Full Stack (NodeJS+ReactJS) N25",
      course: "Backend",
      price: "0",
      status: "ACTIVE",
      days: ["Juma", "Chorshanba"],
      time: "09:00",
      duration: "90 minut",
      room: "2-xona",
    };

    if (!incomingGroup) return fallback;

    return {
      ...fallback,
      ...incomingGroup,
      days: normalizeDays(incomingGroup.days ?? incomingGroup.weekDays),
      course:
        typeof incomingGroup.course === "string"
          ? incomingGroup.course
          : incomingGroup.course?.name || fallback.course,
    };
  };

  const normalizeStudentList = (list) => {
    if (!Array.isArray(list)) return [];
    return list.map((student) => ({
      id: student?.id,
      name:
        student?.name || student?.fullName || student?.student?.fullName || "-",
      phone: student?.phone || student?.email || student?.student?.email || "-",
      active: true,
    }));
  };

  const fileRef = useRef(null);

  const [groupDeleted, setGroupDeleted] = useState(false);

  const [groupData, setGroupData] = useState(() => normalizeGroup(group));

  const [students, setStudents] = useState(() =>
    normalizeStudentList(group?.students),
  );
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceSavingMap, setAttendanceSavingMap] = useState({});
  const [homeworksLoading, setHomeworksLoading] = useState(false);
  const [videosLoading, setVideosLoading] = useState(false);
  const [homeworkSaving, setHomeworkSaving] = useState(false);
  const [deletingHomeworkId, setDeletingHomeworkId] = useState(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoLessonId, setVideoLessonId] = useState("");
  const [showVideoUploadModal, setShowVideoUploadModal] = useState(false);
  const [lessons, setLessons] = useState([]);
  const [teachers, setTeachers] = useState(
    group?.teacher
      ? [{ id: group?.teacherId || 1, name: group.teacher, phone: "-" }]
      : defaultTeachers,
  );
  const [homeworks, setHomeworks] = useState([]);
  const [videos, setVideos] = useState([]);

  const [attendance, setAttendance] = useState({});

  const groupDays = useMemo(
    () => normalizeDays(groupData?.days),
    [groupData?.days],
  );

  const dateHeaders = useMemo(() => {
    if (!Array.isArray(lessons) || lessons.length === 0) {
      return makeDateHeaders().map((item) => ({
        ...item,
        key: `${item.day}-${item.num}`,
        lessonId: null,
      }));
    }

    return [...lessons]
      .sort(
        (a, b) =>
          new Date(a.created_at || 0).getTime() -
          new Date(b.created_at || 0).getTime(),
      )
      .slice(-9)
      .map((lesson) => {
        const label = lessonDateLabel(lesson.created_at);
        return {
          day: label.day,
          num: label.num,
          key: `lesson-${lesson.id}`,
          lessonId: lesson.id,
        };
      });
  }, [lessons]);

  useEffect(() => {
    if (!group?.id) return;

    const loadStudentsAndAttendance = async () => {
      try {
        setStudentsLoading(true);
        setAttendanceLoading(true);

        const [studentsResult, lessonsResult] = await Promise.allSettled([
          groupsApi.getStudentsByGroup(group.id),
          groupsApi.getLessonsByGroup(group.id),
        ]);

        const list =
          studentsResult.status === "fulfilled" &&
          Array.isArray(studentsResult.value?.data)
            ? studentsResult.value.data
            : [];

        const lessonList =
          lessonsResult.status === "fulfilled" &&
          Array.isArray(lessonsResult.value?.data)
            ? lessonsResult.value.data
            : [];

        setLessons(lessonList);
        setStudents(
          list
            .map((student) => ({
              id: student.id,
              name: student.fullName,
              phone: student.email || "-",
              active: true,
            }))
            .sort((a, b) =>
              String(a.name || "").localeCompare(String(b.name || "")),
            ),
        );

        if (lessonList.length === 0) {
          setAttendance({});
          return;
        }

        const attendanceByStudent = {};

        await Promise.all(
          lessonList.map(async (lesson) => {
            try {
              const attendanceResult = await attendanceApi.getByLesson(
                lesson.id,
              );
              const rows = Array.isArray(attendanceResult?.data)
                ? attendanceResult.data
                : [];

              rows.forEach((row) => {
                const studentId = row?.student?.id;
                if (!studentId) return;
                if (!attendanceByStudent[studentId]) {
                  attendanceByStudent[studentId] = {};
                }
                attendanceByStudent[studentId][`lesson-${lesson.id}`] =
                  row.isPresent ? "Bor" : "Yo'q";
              });
            } catch {
              // Ignore single lesson attendance load failure and keep UI usable.
            }
          }),
        );

        setAttendance(attendanceByStudent);
      } catch {
        // Keep existing data when possible instead of blanking the whole page.
        setLessons([]);
        setAttendance({});
      } finally {
        setStudentsLoading(false);
        setAttendanceLoading(false);
      }
    };

    loadStudentsAndAttendance();
  }, [group?.id]);

  useEffect(() => {
    setGroupData(normalizeGroup(group));
    setStudents(normalizeStudentList(group?.students));
    setTeachers(
      group?.teacher
        ? [
            {
              id: group?.teacherId || 1,
              name: group?.teacher || "-",
              phone: "-",
            },
          ]
        : defaultTeachers,
    );
  }, [group]);

  useEffect(() => {
    loadHomeworks();
    loadVideos();
  }, [group?.id]);

  useEffect(() => {
    if (!showVideoUploadModal) return;
    if (videoLessonId) return;
    if (!Array.isArray(lessons) || lessons.length === 0) return;
    setVideoLessonId(String(lessons[0].id));
  }, [showVideoUploadModal, lessons, videoLessonId]);

  useEffect(() => {
    setAttendance((prev) => {
      const next = {};

      students.forEach((student) => {
        next[student.id] = prev[student.id] || {};
        dateHeaders.forEach((d) => {
          if (!(d.key in next[student.id])) {
            next[student.id][d.key] = "";
          }
        });
      });

      return next;
    });
  }, [students, dateHeaders]);

  const [activeMainTab, setActiveMainTab] = useState(
    group?.initialMainTab || "guruh-darsliklari",
  );
  const [activeLessonTab, setActiveLessonTab] = useState("darsliklar");
  const [lessonPage, setLessonPage] = useState("list");

  const [showEditModal, setShowEditModal] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [groupDeleteLoading, setGroupDeleteLoading] = useState(false);
  const [teacherAssigning, setTeacherAssigning] = useState(false);
  const [studentAssigning, setStudentAssigning] = useState(false);
  const [teacherOptionsLoading, setTeacherOptionsLoading] = useState(false);
  const [studentOptionsLoading, setStudentOptionsLoading] = useState(false);
  const [teacherOptions, setTeacherOptions] = useState([]);
  const [studentOptions, setStudentOptions] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [openPersonMenu, setOpenPersonMenu] = useState(null);

  useEffect(() => {
    if (!showTeacherModal) return;
    loadTeacherOptions();
  }, [showTeacherModal]);

  useEffect(() => {
    if (!showStudentModal) return;
    loadStudentOptions();
  }, [showStudentModal, students]);

  const [selectedHomework, setSelectedHomework] = useState(null);

  const [editForm, setEditForm] = useState({
    name: groupData.name,
    course: groupData.course,
    price: groupData.price,
    status: groupData.status || "ACTIVE",
    days: groupDays.join(", "),
    time: groupData.lessonTime || groupData.time,
    duration: groupData.duration,
    room: groupData.room,
  });

  useEffect(() => {
    setActiveMainTab(group?.initialMainTab || "guruh-darsliklari");
    setLessonPage("list");
  }, [group?.id, group?.initialMainTab]);

  const [homeworkForm, setHomeworkForm] = useState({
    lessonId: "",
    title: "",
    durationTime: "16",
    file: null,
  });
  const [lessonForm, setLessonForm] = useState({
    title: "",
  });
  const [lessonSaving, setLessonSaving] = useState(false);

  const actionBtnClass = darkMode
    ? "px-3 py-2 rounded-xl border border-slate-700 text-slate-200 hover:bg-slate-800 transition text-sm"
    : "px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition text-sm";

  const infoCardClass = `${theme.card} border rounded-2xl p-3 shadow-sm min-h-0`;
  const innerBorderClass = darkMode ? "border-slate-700" : "border-slate-200";
  const personCardClass = darkMode
    ? "group flex items-center justify-between gap-3 rounded-2xl border border-slate-700/90 bg-slate-900/70 px-3 py-2.5 min-w-0 transition hover:bg-slate-800/80 hover:border-slate-600"
    : "group flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 min-w-0 transition hover:bg-slate-50 hover:border-slate-300";
  const avatarClass = darkMode
    ? "w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 bg-gradient-to-br from-slate-700 to-slate-800 text-slate-100"
    : "w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700";

  const inputClass = darkMode
    ? "w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none"
    : "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none";

  const tabClass = (active) =>
    active
      ? "pb-3 text-sm font-medium border-b-2 border-emerald-500 text-emerald-600"
      : darkMode
        ? "pb-3 text-sm font-medium border-b-2 border-transparent text-slate-400"
        : "pb-3 text-sm font-medium border-b-2 border-transparent text-slate-500";

  const subTabClass = (active) =>
    active
      ? "px-4 py-2 rounded-xl bg-white border border-emerald-300 text-slate-900 text-sm font-medium shadow-sm"
      : darkMode
        ? "px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-sm font-medium"
        : "px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-sm font-medium";

  const formatDateTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("uz-UZ", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrettyDateTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleString("uz-UZ", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytesValue) => {
    const bytes = Number(bytesValue);
    if (!Number.isFinite(bytes) || bytes <= 0) return "-";

    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const getVideoSize = async (fileUrl) => {
    if (!fileUrl) return "-";

    try {
      const response = await fetch(fileUrl, { method: "HEAD" });
      const contentLength = response.headers.get("content-length");
      return formatFileSize(contentLength);
    } catch {
      return "-";
    }
  };

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("uz-UZ", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const loadHomeworks = async () => {
    if (!group?.id) {
      setHomeworks([]);
      return;
    }

    try {
      setHomeworksLoading(true);
      const result = await homeworkApi.getByGroup(group.id);
      const list = Array.isArray(result?.data) ? result.data : [];

      const mapped = await Promise.all(
        list.map(async (item) => {
          const statuses = await homeworkApi.getStatuses(item.id);
          const pending = statuses.PENDING.length;
          const approved = statuses.APPROVED.length;
          const rejected = statuses.REJECTED.length;
          const notReviewed = statuses.NOT_REVIEWED.length;
          const total = pending + approved + rejected + notReviewed;

          const createdAt = item.created_at ? new Date(item.created_at) : null;
          const deadlineDate = createdAt
            ? new Date(
                createdAt.getTime() +
                  Number(item.durationTime || 16) * 60 * 60 * 1000,
              )
            : null;

          return {
            id: item.id,
            title: item.title,
            lessonId: item.lessonId,
            file: item.file || "",
            total,
            submitted: pending + approved + rejected,
            checked: approved + rejected,
            pending,
            approved,
            rejected,
            notReviewed,
            assignedAt: formatDateTime(item.created_at),
            deadline: formatDateTime(deadlineDate),
            lessonDate: formatDate(item.lesson?.created_at || item.created_at),
          };
        }),
      );

      setHomeworks(mapped);
    } catch {
      setHomeworks([]);
    } finally {
      setHomeworksLoading(false);
    }
  };

  const loadVideos = async () => {
    if (!group?.id) {
      setVideos([]);
      return;
    }

    try {
      setVideosLoading(true);
      const result = await lessonVideosApi.getByGroup(group.id);
      const list = Array.isArray(result?.data) ? result.data : [];

      const mappedVideos = await Promise.all(
        list.map(async (item) => ({
          id: item.id,
          name: item.file ? String(item.file).split("/").pop() : "Video",
          lessonName: item.lesson?.title || "-",
          status: "Tayyor",
          lessonDate: formatDate(item.lesson?.created_at),
          size: await getVideoSize(item.file),
          uploadedAt: formatPrettyDateTime(item.created_at),
          file: item.file,
        })),
      );

      setVideos(mappedVideos);
    } catch {
      setVideos([]);
    } finally {
      setVideosLoading(false);
    }
  };

  const setAttendanceValue = async (studentId, header, next) => {
    if (!header?.lessonId) {
      alert("Bu sana uchun dars topilmadi");
      return;
    }

    const key = header.key;
    const loadingKey = `${studentId}-${header.lessonId}`;
    const current = attendance[studentId]?.[key] || "";

    if (current === next) {
      return;
    }

    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [key]: next,
      },
    }));
    setAttendanceSavingMap((prev) => ({ ...prev, [loadingKey]: true }));

    try {
      await attendanceApi.update({
        lessonId: header.lessonId,
        studentId,
        isPresent: next === "Bor",
      });
    } catch (error) {
      if (error?.response?.status === 404) {
        await attendanceApi.create({
          lessonId: header.lessonId,
          studentId,
          isPresent: next === "Bor",
        });
      } else {
        setAttendance((prev) => ({
          ...prev,
          [studentId]: {
            ...prev[studentId],
            [key]: current,
          },
        }));
        alert(error?.response?.data?.message || "Davomatni saqlashda xato");
      }
    } finally {
      setAttendanceSavingMap((prev) => {
        const copy = { ...prev };
        delete copy[loadingKey];
        return copy;
      });
    }
  };

  const openEditModal = () => {
    setEditForm({
      name: groupData.name || "",
      course: groupData.course || "",
      price: groupData.price || "",
      status: groupData.status || "ACTIVE",
      days: groupDays.join(", "),
      time: groupData.lessonTime || groupData.time || "",
      duration: groupData.duration || "",
      room: groupData.room || "",
    });
    setShowEditModal(true);
  };

  const saveGroupEdit = async () => {
    try {
      if (group?.id) {
        await groupsApi.update(group.id, { status: editForm.status });
      }

      setGroupData((prev) => ({
        ...prev,
        name: editForm.name,
        course: editForm.course,
        price: editForm.price,
        status: editForm.status,
        days: editForm.days
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        time: editForm.time,
        duration: editForm.duration,
        room: editForm.room,
      }));
      setShowEditModal(false);
    } catch (error) {
      alert(error?.response?.data?.message || "Statusni yangilashda xato");
    }
  };

  const loadGroupStudents = async () => {
    if (!group?.id) {
      setStudents([]);
      return;
    }

    try {
      const studentsResult = await groupsApi.getStudentsByGroup(group.id);
      const list = Array.isArray(studentsResult?.data)
        ? studentsResult.data
        : [];

      setStudents(
        list
          .map((student) => ({
            id: student.id,
            name: student.fullName,
            phone: student.email || "-",
            active: true,
          }))
          .sort((a, b) =>
            String(a.name || "").localeCompare(String(b.name || "")),
          ),
      );
    } catch {
      setStudents([]);
    }
  };

  const loadTeacherOptions = async () => {
    try {
      setTeacherOptionsLoading(true);
      const result = await teachersApi.getAll();
      const list = Array.isArray(result?.data) ? result.data : [];
      setTeacherOptions(list);
    } catch {
      setTeacherOptions([]);
    } finally {
      setTeacherOptionsLoading(false);
    }
  };

  const loadStudentOptions = async () => {
    try {
      setStudentOptionsLoading(true);
      const result = await studentsApi.getAll();
      const list = Array.isArray(result?.data) ? result.data : [];
      const inGroupStudentIds = new Set(
        students.map((student) => Number(student.id)),
      );

      setStudentOptions(
        list.filter((student) => !inGroupStudentIds.has(Number(student.id))),
      );
    } catch {
      setStudentOptions([]);
    } finally {
      setStudentOptionsLoading(false);
    }
  };

  const addTeacher = async () => {
    if (!group?.id) {
      alert("Guruh tanlanmagan");
      return;
    }

    if (!selectedTeacherId) {
      alert("O‘qituvchini tanlang");
      return;
    }

    try {
      setTeacherAssigning(true);
      await groupsApi.update(group.id, {
        teacherId: Number(selectedTeacherId),
      });

      const selectedTeacher = teacherOptions.find(
        (teacher) => Number(teacher.id) === Number(selectedTeacherId),
      );

      if (selectedTeacher) {
        setTeachers([
          {
            id: selectedTeacher.id,
            name: selectedTeacher.fullName,
            phone: selectedTeacher.phone || selectedTeacher.email || "-",
          },
        ]);
      }

      setSelectedTeacherId("");
      setShowTeacherModal(false);
    } catch (error) {
      alert(
        error?.response?.data?.message || "O‘qituvchini biriktirishda xato",
      );
    } finally {
      setTeacherAssigning(false);
    }
  };

  const addStudent = async () => {
    if (!group?.id) {
      alert("Guruh tanlanmagan");
      return;
    }

    if (!selectedStudentId) {
      alert("Talabani tanlang");
      return;
    }

    try {
      setStudentAssigning(true);
      await studentGroupApi.create({
        groupId: Number(group.id),
        studentId: Number(selectedStudentId),
      });

      await loadGroupStudents();
      await loadStudentOptions();
      setSelectedStudentId("");
      setShowStudentModal(false);
      alert("Talaba guruhga muvaffaqiyatli qo‘shildi");
    } catch (error) {
      alert(
        error?.response?.data?.message || "Talabani guruhga qo'shishda xato",
      );
    } finally {
      setStudentAssigning(false);
    }
  };

  const addHomework = async () => {
    if (!group?.id) {
      alert("Guruh tanlanmagan");
      return;
    }

    if (!homeworkForm.lessonId) {
      alert("Darsni tanlang");
      return;
    }

    if (!homeworkForm.title.trim()) {
      alert("Sarlavha kiriting");
      return;
    }

    try {
      setHomeworkSaving(true);
      await homeworkApi.create({
        groupId: Number(group.id),
        lessonId: Number(homeworkForm.lessonId),
        title: homeworkForm.title.trim(),
        durationTime: Number(homeworkForm.durationTime || 16),
        file: homeworkForm.file || undefined,
      });

      await loadHomeworks();
      setHomeworkForm({
        lessonId: "",
        title: "",
        durationTime: "16",
        file: null,
      });
      setLessonPage("list");
      setActiveLessonTab("uyga-vazifa");
    } catch (error) {
      alert(error?.response?.data?.message || "Uyga vazifa yaratishda xato");
    } finally {
      setHomeworkSaving(false);
    }
  };

  const addLesson = async () => {
    if (!group?.id) {
      alert("Guruh tanlanmagan");
      return;
    }

    if (!lessonForm.title.trim()) {
      alert("Mavzuni kiriting");
      return;
    }

    try {
      setLessonSaving(true);
      await lessonsApi.create({
        groupId: Number(group.id),
        title: lessonForm.title.trim(),
      });

      await loadGroupStudents();

      const lessonsResult = await groupsApi.getLessonsByGroup(group.id);
      setLessons(Array.isArray(lessonsResult?.data) ? lessonsResult.data : []);

      setLessonForm({
        title: "",
      });
      alert("Dars muvaffaqiyatli yaratildi");
    } catch (error) {
      alert(error?.response?.data?.message || "Dars yaratishda xato");
    } finally {
      setLessonSaving(false);
    }
  };

  const handleVideoUpload = async (file) => {
    if (!group?.id) {
      alert("Guruh tanlanmagan");
      return;
    }

    if (!videoLessonId) {
      alert("Darsni tanlang");
      return;
    }

    if (!file) return;

    try {
      setVideoUploading(true);
      await lessonVideosApi.create({
        groupId: Number(group.id),
        lessonId: Number(videoLessonId),
        file,
      });
      await loadVideos();
      setShowVideoUploadModal(false);
    } catch (error) {
      alert(error?.response?.data?.message || "Video yuklashda xato");
    } finally {
      setVideoUploading(false);
    }
  };

  const openHomeworkDetail = (homework) => {
    setSelectedHomework(homework);
  };

  const deleteTeacher = (id) => {
    const isOk = window.confirm("Rostan ham o‘qituvchini o‘chirmoqchimisiz?");
    if (!isOk) return;
    setTeachers((prev) => prev.filter((teacher) => teacher.id !== id));
    setOpenPersonMenu(null);
  };

  const deleteStudent = async (id) => {
    const isOk = window.confirm("Rostan ham talabani o‘chirmoqchimisiz?");
    if (!isOk) return;

    if (!group?.id) {
      alert("Guruh tanlanmagan");
      return;
    }

    try {
      await studentGroupApi.remove({
        groupId: Number(group.id),
        studentId: Number(id),
      });

      await loadGroupStudents();
      setAttendance((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      setOpenPersonMenu(null);
    } catch (error) {
      alert(
        error?.response?.data?.message || "Talabani guruhdan o‘chirishda xato",
      );
    }
  };

  const editTeacher = (id) => {
    const target = teachers.find((teacher) => teacher.id === id);
    if (!target) return;

    const nextName = window.prompt("O‘qituvchi ismi", target.name || "");
    if (nextName === null) return;
    const nextPhone = window.prompt("Telefon", target.phone || "");
    if (nextPhone === null) return;

    setTeachers((prev) =>
      prev.map((teacher) =>
        teacher.id === id
          ? {
              ...teacher,
              name: nextName.trim() || teacher.name,
              phone: nextPhone.trim() || "-",
            }
          : teacher,
      ),
    );
    setOpenPersonMenu(null);
  };

  const editStudent = (id) => {
    const target = students.find((student) => student.id === id);
    if (!target) return;

    const nextName = window.prompt("Talaba ismi", target.name || "");
    if (nextName === null) return;
    const nextPhone = window.prompt("Telefon", target.phone || "");
    if (nextPhone === null) return;

    setStudents((prev) =>
      prev
        .map((student) =>
          student.id === id
            ? {
                ...student,
                name: nextName.trim() || student.name,
                phone: nextPhone.trim() || "-",
              }
            : student,
        )
        .sort((a, b) =>
          String(a.name || "").localeCompare(String(b.name || "")),
        ),
    );
    setOpenPersonMenu(null);
  };

  const deleteHomework = async (id) => {
    const isOk = window.confirm("Rostan ham uyga vazifani o‘chirmoqchimisiz?");
    if (!isOk) return;

    try {
      setDeletingHomeworkId(id);
      await homeworkApi.remove(id);
      await loadHomeworks();
    } catch (error) {
      alert(error?.response?.data?.message || "Uyga vazifani o‘chirishda xato");
    } finally {
      setDeletingHomeworkId(null);
    }
  };

  const deleteGroup = async () => {
    const isOk = window.confirm("Rostan ham guruhni o‘chirmoqchimisiz?");
    if (!isOk) return;

    if (!group?.id) {
      alert("Guruh ID topilmadi");
      return;
    }

    try {
      setGroupDeleteLoading(true);
      await groupsApi.remove(group.id);
      setGroupDeleted(true);
    } catch (error) {
      alert(error?.response?.data?.message || "Guruhni o'chirishda xato");
    } finally {
      setGroupDeleteLoading(false);
    }
  };

  if (groupDeleted) {
    return (
      <div className="h-dvh w-full flex items-center justify-center p-4 overflow-hidden">
        <div
          className={`${theme.card} border rounded-2xl p-6 text-center shadow-sm max-w-md w-full`}
        >
          <h2 className={`text-xl font-bold mb-2 ${theme.text}`}>
            Guruh o‘chirildi
          </h2>
          <p className={`${theme.soft} mb-4`}>
            Bu guruh muvaffaqiyatli o‘chirildi.
          </p>
          <button onClick={onBack} className={actionBtnClass}>
            ← Orqaga qaytish
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-dvh w-full overflow-hidden">
        <div className="h-full flex flex-col gap-3 p-3 overflow-hidden">
          <div className="shrink-0 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 min-w-0">
            <div className="flex items-start sm:items-center gap-3 flex-wrap min-w-0">
              <button onClick={onBack} className={`${actionBtnClass} shrink-0`}>
                ← Orqaga
              </button>

              <div className="min-w-0">
                <h2
                  className={`text-lg sm:text-xl font-bold truncate ${theme.text}`}
                >
                  {groupData.name}
                </h2>
                <p className={`text-xs sm:text-sm mt-1 truncate ${theme.soft}`}>
                  Guruh ma'lumotlari
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={openEditModal} className={actionBtnClass}>
                ✏️ Tahrirlash
              </button>

              <button
                onClick={() => {
                  setSelectedTeacherId("");
                  setShowTeacherModal(true);
                }}
                className={actionBtnClass}
              >
                + O‘qituvchi qo‘shish
              </button>

              <button
                onClick={() => {
                  setSelectedStudentId("");
                  setShowStudentModal(true);
                }}
                className={actionBtnClass}
              >
                + O‘quvchi qo‘shish
              </button>

              <button
                disabled={groupDeleteLoading}
                onClick={deleteGroup}
                className="w-10 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white transition shrink-0 disabled:opacity-60"
              >
                {groupDeleteLoading ? "..." : "🗑️"}
              </button>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-3 border-b border-slate-200 overflow-x-auto">
            <button
              onClick={() => {
                setActiveMainTab("malumotlar");
                setLessonPage("list");
              }}
              className={tabClass(activeMainTab === "malumotlar")}
            >
              Ma&apos;lumotlar
            </button>
            <button
              onClick={() => {
                setActiveMainTab("guruh-darsliklari");
                setLessonPage("list");
              }}
              className={tabClass(activeMainTab === "guruh-darsliklari")}
            >
              Guruh darsliklari
            </button>
            <button
              onClick={() => {
                setActiveMainTab("akademik-davomat");
                setLessonPage("list");
              }}
              className={tabClass(activeMainTab === "akademik-davomat")}
            >
              Akademik davomat
            </button>
          </div>

          {activeMainTab !== "guruh-darsliklari" && (
            <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-3 overflow-hidden">
              <div className="min-h-0 overflow-hidden flex flex-col gap-3">
                <div className={infoCardClass}>
                  <div className="flex items-center justify-between gap-3 mb-3 min-w-0">
                    <h3
                      className={`text-sm sm:text-base font-semibold ${theme.text}`}
                    >
                      Ma&apos;lumotlar
                    </h3>

                    <span
                      className={`px-3 py-1 rounded-full text-xs border shrink-0 ${theme.chip}`}
                    >
                      {groupData.course}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs sm:text-sm min-w-0">
                    <div>
                      <p className={theme.soft}>Kurs nomi</p>
                      <p
                        className={`font-medium wrap-break-word ${theme.text}`}
                      >
                        {groupData.course}
                      </p>
                    </div>

                    <div>
                      <p className={theme.soft}>Kurs to‘lovi</p>
                      <p
                        className={`font-medium wrap-break-word ${theme.text}`}
                      >
                        {Number(groupData.price || 0).toLocaleString()} so‘m
                      </p>
                    </div>

                    <div>
                      <p className={theme.soft}>O‘tish kunlari</p>
                      <p
                        className={`font-medium wrap-break-word ${theme.text}`}
                      >
                        {groupDays.join(", ")}
                      </p>
                    </div>

                    <div>
                      <p className={theme.soft}>O‘tish vaqti</p>
                      <p
                        className={`font-medium wrap-break-word ${theme.text}`}
                      >
                        {groupData.lessonTime || groupData.time}
                      </p>
                    </div>

                    <div>
                      <p className={theme.soft}>O‘qish davomiyligi</p>
                      <p
                        className={`font-medium wrap-break-word ${theme.text}`}
                      >
                        {groupData.duration}
                      </p>
                    </div>

                    <div>
                      <p className={theme.soft}>Xona</p>
                      <p
                        className={`font-medium wrap-break-word ${theme.text}`}
                      >
                        {groupData.room}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={infoCardClass}>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h3
                      className={`text-sm sm:text-base font-semibold ${theme.text}`}
                    >
                      O‘qituvchilar
                    </h3>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] border ${theme.chip}`}
                    >
                      {teachers.length} ta
                    </span>
                  </div>

                  <div className="space-y-2 max-h-45 overflow-y-auto pr-1">
                    {teachers.map((teacher) => (
                      <article key={teacher.id} className={personCardClass}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={avatarClass}>
                            {getInitial(teacher.name)}
                          </div>

                          <div className="min-w-0">
                            <p
                              className={`text-sm font-semibold truncate ${theme.text}`}
                            >
                              {teacher.name}
                            </p>
                            <p className={`text-xs truncate ${theme.soft}`}>
                              {teacher.phone}
                            </p>
                          </div>
                        </div>

                        <div className="relative shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenPersonMenu((prev) =>
                                prev?.type === "teacher" &&
                                prev?.id === teacher.id
                                  ? null
                                  : { type: "teacher", id: teacher.id },
                              )
                            }
                            className={`w-8 h-8 rounded-lg border text-base leading-none flex items-center justify-center cursor-pointer transition ${
                              darkMode
                                ? "border-slate-600 text-slate-200 hover:bg-slate-800"
                                : "border-slate-200 text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            ...
                          </button>

                          {openPersonMenu?.type === "teacher" &&
                            openPersonMenu?.id === teacher.id && (
                              <div
                                className={`absolute right-0 top-9 z-30 min-w-30 rounded-xl border shadow-lg p-1 ${
                                  darkMode
                                    ? "bg-slate-900 border-slate-700"
                                    : "bg-white border-slate-200"
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => editTeacher(teacher.id)}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-xs ${
                                    darkMode
                                      ? "text-slate-200 hover:bg-slate-800"
                                      : "text-slate-700 hover:bg-slate-50"
                                  }`}
                                >
                                  Tahrirlash
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteTeacher(teacher.id)}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-xs ${
                                    darkMode
                                      ? "text-red-300 hover:bg-red-500/10"
                                      : "text-red-600 hover:bg-red-50"
                                  }`}
                                >
                                  O‘chirish
                                </button>
                              </div>
                            )}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>

                <div className={`${infoCardClass} flex-1 overflow-hidden`}>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h3
                      className={`text-sm sm:text-base font-semibold ${theme.text}`}
                    >
                      Talabalar
                    </h3>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] border ${theme.chip}`}
                    >
                      {students.length} ta
                    </span>
                  </div>

                  <div className="h-full overflow-y-auto pr-1 space-y-2">
                    {studentsLoading ? (
                      <div className={`text-sm ${theme.soft}`}>
                        Yuklanmoqda...
                      </div>
                    ) : students.length === 0 ? (
                      <div className={`text-sm ${theme.soft}`}>
                        Talabalar topilmadi
                      </div>
                    ) : (
                      students.map((student) => (
                        <article key={student.id} className={personCardClass}>
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={avatarClass}>
                              {getInitial(student.name)}
                            </div>

                            <div className="min-w-0">
                              <p
                                className={`text-sm font-semibold truncate ${theme.text}`}
                              >
                                {student.name}
                              </p>
                              <p className={`text-xs truncate ${theme.soft}`}>
                                {student.phone}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-medium border ${
                                darkMode
                                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              }`}
                            >
                              Faol
                            </span>

                            <div className="relative">
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenPersonMenu((prev) =>
                                    prev?.type === "student" &&
                                    prev?.id === student.id
                                      ? null
                                      : { type: "student", id: student.id },
                                  )
                                }
                                className={`w-8 h-8 rounded-lg border text-base leading-none flex items-center justify-center cursor-pointer transition ${
                                  darkMode
                                    ? "border-slate-600 text-slate-200 hover:bg-slate-800"
                                    : "border-slate-200 text-slate-600 hover:bg-slate-100"
                                }`}
                              >
                                ...
                              </button>

                              {openPersonMenu?.type === "student" &&
                                openPersonMenu?.id === student.id && (
                                  <div
                                    className={`absolute right-0 top-9 z-30 min-w-30 rounded-xl border shadow-lg p-1 ${
                                      darkMode
                                        ? "bg-slate-900 border-slate-700"
                                        : "bg-white border-slate-200"
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => editStudent(student.id)}
                                      className={`w-full text-left px-3 py-2 rounded-lg text-xs ${
                                        darkMode
                                          ? "text-slate-200 hover:bg-slate-800"
                                          : "text-slate-700 hover:bg-slate-50"
                                      }`}
                                    >
                                      Tahrirlash
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => deleteStudent(student.id)}
                                      className={`w-full text-left px-3 py-2 rounded-lg text-xs ${
                                        darkMode
                                          ? "text-red-300 hover:bg-red-500/10"
                                          : "text-red-600 hover:bg-red-50"
                                      }`}
                                    >
                                      O‘chirish
                                    </button>
                                  </div>
                                )}
                            </div>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {activeMainTab === "malumotlar" && (
                <div
                  className={`${theme.card} border rounded-2xl shadow-sm min-w-0 min-h-0 flex flex-col overflow-hidden`}
                >
                  <div
                    className={`shrink-0 px-4 py-3 flex items-center justify-between gap-3 border-b min-w-0 ${innerBorderClass}`}
                  >
                    <h3
                      className={`text-sm sm:text-base font-semibold ${theme.text}`}
                    >
                      Yangi dars yaratish
                    </h3>
                  </div>

                  <div className="flex-1 min-h-0 overflow-auto p-4 sm:p-6">
                    <div className="max-w-4xl mx-auto space-y-5">
                      <div>
                        <label
                          className={`block text-sm font-medium mb-2 ${theme.text}`}
                        >
                          * Mavzu
                        </label>
                        <input
                          className={inputClass}
                          placeholder="Mavzuni kiriting"
                          value={lessonForm.title}
                          onChange={(e) =>
                            setLessonForm((prev) => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                        />
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium mb-2 ${theme.text}`}
                        >
                          Izoh
                        </label>
                        <textarea
                          rows={5}
                          className={inputClass}
                          placeholder="Qo'shimcha izoh"
                          value={lessonForm.description}
                          onChange={(e) =>
                            setLessonForm((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                        />
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium mb-2 ${theme.text}`}
                        >
                          Fayl yuklash (ixtiyoriy)
                        </label>

                        <label
                          className={`flex items-center justify-center w-full rounded-xl border border-dashed ${innerBorderClass} px-4 py-6 cursor-pointer ${darkMode ? "hover:bg-slate-800" : "hover:bg-slate-50"}`}
                        >
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) =>
                              setLessonForm((prev) => ({
                                ...prev,
                                file: e.target.files?.[0] || null,
                              }))
                            }
                          />
                          <span className={theme.soft}>
                            ⬇ Yuklash{" "}
                            {lessonForm.file?.name
                              ? `- ${lessonForm.file.name}`
                              : ""}
                          </span>
                        </label>
                        <p className={`mt-2 text-xs ${theme.soft}`}>
                          Eslatma: hozir backend darsga fayl/izoh saqlamaydi,
                          faqat mavzu saqlanadi.
                        </p>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          onClick={() =>
                            setLessonForm({
                              title: "",
                              description: "",
                              file: null,
                            })
                          }
                          className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                        >
                          Bekor qilish
                        </button>

                        <button
                          disabled={lessonSaving}
                          onClick={addLesson}
                          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-60"
                        >
                          {lessonSaving ? "Saqlanmoqda..." : "E'lon qilish"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeMainTab === "akademik-davomat" && (
                <div
                  className={`${theme.card} border rounded-2xl shadow-sm min-w-0 min-h-0 flex flex-col overflow-hidden`}
                >
                  <div
                    className={`shrink-0 px-4 py-3 flex items-center justify-between gap-3 border-b min-w-0 ${innerBorderClass}`}
                  >
                    <h3
                      className={`text-sm sm:text-base font-semibold ${theme.text}`}
                    >
                      Davomat
                    </h3>
                    <div
                      className={`text-xs sm:text-sm font-medium ${theme.text}`}
                    >
                      {attendanceLoading ? "Yuklanmoqda..." : "Davomat"}
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 overflow-hidden">
                    <div className="hidden lg:block h-full overflow-auto">
                      <table className="w-full text-sm table-fixed">
                        <thead
                          className={`${darkMode ? "bg-slate-800" : "bg-slate-50"} sticky top-0 z-10`}
                        >
                          <tr>
                            <th
                              className={`text-left px-3 py-3 w-65 ${theme.text}`}
                            >
                              Nomi
                            </th>

                            {dateHeaders.map((item) => (
                              <th
                                key={item.key}
                                className={`px-1 py-3 text-center ${theme.text}`}
                              >
                                <div className="text-[10px]">{item.day}</div>
                                <div className="text-xs font-semibold">
                                  {item.num}
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>

                        <tbody>
                          {students.map((student) => (
                            <tr
                              key={student.id}
                              className={`border-t ${theme.rowBorder} ${
                                darkMode
                                  ? "hover:bg-slate-800/40"
                                  : "hover:bg-slate-50"
                              }`}
                            >
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                      darkMode
                                        ? "bg-slate-800 text-slate-200"
                                        : "bg-slate-100 text-slate-600"
                                    }`}
                                  >
                                    {getInitial(student.name)}
                                  </div>

                                  <div className="min-w-0">
                                    <p
                                      className={`font-medium truncate ${theme.text}`}
                                    >
                                      {student.name}
                                    </p>
                                    <p className={`text-xs ${theme.soft}`}>
                                      Faol
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {dateHeaders.map((item) => {
                                const key = item.key;
                                const value =
                                  attendance[student.id]?.[key] || "";
                                const savingKey = `${student.id}-${item.lessonId}`;
                                const isSaving =
                                  !!attendanceSavingMap[savingKey];
                                const isBor = value === "Bor";
                                const isYoq = value === "Yo'q";

                                return (
                                  <td
                                    key={key}
                                    className="px-1 py-2 text-center"
                                  >
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        disabled={isSaving || !item.lessonId}
                                        onClick={() =>
                                          setAttendanceValue(
                                            student.id,
                                            item,
                                            "Bor",
                                          )
                                        }
                                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium border transition disabled:opacity-60 ${
                                          isBor
                                            ? "bg-emerald-500 text-white border-emerald-500"
                                            : darkMode
                                              ? "border-slate-700 text-slate-300"
                                              : "border-slate-200 text-slate-600"
                                        }`}
                                      >
                                        Bor
                                      </button>
                                      <button
                                        disabled={isSaving || !item.lessonId}
                                        onClick={() =>
                                          setAttendanceValue(
                                            student.id,
                                            item,
                                            "Yo'q",
                                          )
                                        }
                                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium border transition disabled:opacity-60 ${
                                          isYoq
                                            ? "bg-red-500 text-white border-red-500"
                                            : darkMode
                                              ? "border-slate-700 text-slate-300"
                                              : "border-slate-200 text-slate-600"
                                        }`}
                                      >
                                        Yo'q
                                      </button>
                                    </div>
                                    {isSaving && (
                                      <div
                                        className={`mt-1 text-[10px] ${theme.soft}`}
                                      >
                                        ...
                                      </div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 lg:hidden h-full overflow-y-auto">
                      {students.map((student) => (
                        <div
                          key={student.id}
                          className={`rounded-2xl border p-3 ${innerBorderClass}`}
                        >
                          <div className="flex items-center gap-3 mb-3 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                darkMode
                                  ? "bg-slate-800 text-slate-200"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {getInitial(student.name)}
                            </div>

                            <div className="min-w-0">
                              <p
                                className={`font-medium truncate ${theme.text}`}
                              >
                                {student.name}
                              </p>
                              <p className={`text-xs truncate ${theme.soft}`}>
                                {student.phone}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {dateHeaders.map((item) => {
                              const key = item.key;
                              const value = attendance[student.id]?.[key] || "";
                              const savingKey = `${student.id}-${item.lessonId}`;
                              const isSaving = !!attendanceSavingMap[savingKey];
                              const isBor = value === "Bor";
                              const isYoq = value === "Yo'q";

                              return (
                                <div
                                  key={key}
                                  className={`rounded-xl px-2 py-2 text-xs border ${innerBorderClass}`}
                                >
                                  <div>{item.day}</div>
                                  <div className="font-bold">{item.num}</div>
                                  <div className="mt-2 flex items-center gap-1">
                                    <button
                                      disabled={isSaving || !item.lessonId}
                                      onClick={() =>
                                        setAttendanceValue(
                                          student.id,
                                          item,
                                          "Bor",
                                        )
                                      }
                                      className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-medium border transition disabled:opacity-60 ${
                                        isBor
                                          ? "bg-emerald-500 text-white border-emerald-500"
                                          : darkMode
                                            ? "border-slate-700 text-slate-300"
                                            : "border-slate-200 text-slate-600"
                                      }`}
                                    >
                                      Bor
                                    </button>
                                    <button
                                      disabled={isSaving || !item.lessonId}
                                      onClick={() =>
                                        setAttendanceValue(
                                          student.id,
                                          item,
                                          "Yo'q",
                                        )
                                      }
                                      className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-medium border transition disabled:opacity-60 ${
                                        isYoq
                                          ? "bg-red-500 text-white border-red-500"
                                          : darkMode
                                            ? "border-slate-700 text-slate-300"
                                            : "border-slate-200 text-slate-600"
                                      }`}
                                    >
                                      Yo'q
                                    </button>
                                  </div>
                                  {isSaving && (
                                    <div
                                      className={`mt-1 text-[10px] ${theme.soft}`}
                                    >
                                      ...
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeMainTab === "guruh-darsliklari" && lessonPage === "list" && (
            <div
              className={`${theme.card} border rounded-2xl shadow-sm flex-1 min-h-0 overflow-hidden`}
            >
              <div
                className={`px-4 py-3 border-b ${innerBorderClass} flex items-center justify-between gap-3 flex-wrap`}
              >
                <div className="flex items-center gap-3 overflow-x-auto">
                  <button
                    onClick={() => setActiveLessonTab("darsliklar")}
                    className={subTabClass(activeLessonTab === "darsliklar")}
                  >
                    Darsliklar
                  </button>

                  <button
                    onClick={() => setActiveLessonTab("uyga-vazifa")}
                    className={subTabClass(activeLessonTab === "uyga-vazifa")}
                  >
                    Uyga vazifa
                  </button>

                  <button
                    onClick={() => setActiveLessonTab("videolar")}
                    className={subTabClass(activeLessonTab === "videolar")}
                  >
                    Videolar
                  </button>
                </div>

                {activeLessonTab === "darsliklar" ? (
                  <button
                    onClick={() => setActiveMainTab("malumotlar")}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm"
                  >
                    Darslik qo‘shish
                  </button>
                ) : activeLessonTab === "uyga-vazifa" ? (
                  <button
                    onClick={() => setLessonPage("create-homework")}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm"
                  >
                    Uyga vazifa qo‘shish
                  </button>
                ) : (
                  <button
                    onClick={() => setShowVideoUploadModal(true)}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm"
                  >
                    Qo‘shish
                  </button>
                )}
              </div>

              <div className="flex-1 min-h-0 overflow-auto p-4">
                {activeLessonTab === "darsliklar" && (
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead
                        className={darkMode ? "bg-slate-800" : "bg-slate-50"}
                      >
                        <tr className={`border-b ${innerBorderClass}`}>
                          <th
                            className={`text-left px-3 py-3 w-16 ${theme.text}`}
                          >
                            #
                          </th>
                          <th className={`text-left px-3 py-3 ${theme.text}`}>
                            Darslik mavzusi
                          </th>
                          <th
                            className={`text-left px-3 py-3 w-52 ${theme.text}`}
                          >
                            Yaratilgan sana
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {lessons.length === 0 && (
                          <tr>
                            <td
                              colSpan={3}
                              className={`px-3 py-10 text-center ${theme.soft}`}
                            >
                              Darsliklar hozircha yo‘q
                            </td>
                          </tr>
                        )}

                        {lessons.map((lesson, index) => (
                          <tr
                            key={lesson.id}
                            className={`border-b ${theme.rowBorder} ${
                              darkMode
                                ? "hover:bg-slate-800/40"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            <td className={`px-3 py-3 ${theme.text}`}>
                              {index + 1}
                            </td>
                            <td className={`px-3 py-3 ${theme.text}`}>
                              {lesson.title || "-"}
                            </td>
                            <td className={`px-3 py-3 ${theme.text}`}>
                              {formatPrettyDateTime(lesson.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeLessonTab === "uyga-vazifa" && (
                  <div className="overflow-auto">
                    <table className="w-full min-w-245 text-sm">
                      <thead
                        className={darkMode ? "bg-slate-800" : "bg-slate-50"}
                      >
                        <tr className={`border-b ${innerBorderClass}`}>
                          <th
                            className={`text-left px-3 py-3 w-12.5 ${theme.text}`}
                          >
                            #
                          </th>
                          <th className={`text-left px-3 py-3 ${theme.text}`}>
                            Mavzu
                          </th>
                          <th
                            className={`text-center px-3 py-3 w-22.5 ${theme.text}`}
                          >
                            👤
                          </th>
                          <th
                            className={`text-center px-3 py-3 w-22.5 ${theme.text}`}
                          >
                            🟡
                          </th>
                          <th
                            className={`text-center px-3 py-3 w-22.5 ${theme.text}`}
                          >
                            🟢
                          </th>
                          <th
                            className={`text-left px-3 py-3 w-45 ${theme.text}`}
                          >
                            Berilgan vaqt
                          </th>
                          <th
                            className={`text-left px-3 py-3 w-45 ${theme.text}`}
                          >
                            Tugash vaqti
                          </th>
                          <th
                            className={`text-left px-3 py-3 w-37.5 ${theme.text}`}
                          >
                            Dars sanasi
                          </th>
                          <th
                            className={`text-center px-3 py-3 w-22.5 ${theme.text}`}
                          >
                            Amal
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {homeworksLoading && (
                          <tr>
                            <td
                              colSpan={9}
                              className={`px-3 py-6 text-center ${theme.soft}`}
                            >
                              Uyga vazifalar yuklanmoqda...
                            </td>
                          </tr>
                        )}

                        {homeworks.map((item, index) => (
                          <tr
                            key={item.id}
                            onClick={() => openHomeworkDetail(item)}
                            className={`border-b ${theme.rowBorder} ${
                              darkMode
                                ? "hover:bg-slate-800/40 cursor-pointer"
                                : "hover:bg-slate-50 cursor-pointer"
                            }`}
                          >
                            <td className={`px-3 py-3 ${theme.text}`}>
                              {index + 1}
                            </td>
                            <td className="px-3 py-3">
                              <button
                                onClick={() => openHomeworkDetail(item)}
                                className={`w-full text-left rounded-md px-3 py-2 text-sm ${
                                  index < 3
                                    ? "bg-[#ff7b57] text-white"
                                    : darkMode
                                      ? "bg-slate-800 text-slate-200"
                                      : "bg-slate-100 text-slate-800"
                                }`}
                              >
                                {item.title}
                              </button>
                            </td>
                            <td
                              className={`px-3 py-3 text-center ${theme.text}`}
                            >
                              {item.total}
                            </td>
                            <td
                              className={`px-3 py-3 text-center ${theme.text}`}
                            >
                              {item.submitted}
                            </td>
                            <td
                              className={`px-3 py-3 text-center ${theme.text}`}
                            >
                              {item.checked}
                            </td>
                            <td className={`px-3 py-3 ${theme.text}`}>
                              {item.assignedAt}
                            </td>
                            <td className={`px-3 py-3 ${theme.text}`}>
                              {item.deadline}
                            </td>
                            <td className={`px-3 py-3 ${theme.text}`}>
                              {item.lessonDate}
                            </td>
                            <td className="px-3 py-3 text-center">
                              <button
                                disabled={deletingHomeworkId === item.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteHomework(item.id);
                                }}
                                className="text-red-500 text-xs disabled:opacity-60"
                              >
                                {deletingHomeworkId === item.id
                                  ? "O‘chirilmoqda..."
                                  : "O‘chirish"}
                              </button>
                            </td>
                          </tr>
                        ))}

                        {homeworks.length === 0 && (
                          <tr>
                            <td
                              colSpan={9}
                              className={`px-3 py-10 text-center ${theme.soft}`}
                            >
                              Uyga vazifalar hozircha yo‘q
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeLessonTab === "videolar" && (
                  <div className="overflow-auto">
                    <table className="w-full min-w-275 text-sm">
                      <thead
                        className={darkMode ? "bg-slate-800" : "bg-slate-50"}
                      >
                        <tr className={`border-b ${innerBorderClass}`}>
                          <th className={`text-left px-3 py-3 ${theme.text}`}>
                            Video nomi
                          </th>
                          <th className={`text-left px-3 py-3 ${theme.text}`}>
                            Dars nomi
                          </th>
                          <th className={`text-left px-3 py-3 ${theme.text}`}>
                            Status
                          </th>
                          <th className={`text-left px-3 py-3 ${theme.text}`}>
                            Dars sanasi
                          </th>
                          <th className={`text-left px-3 py-3 ${theme.text}`}>
                            Hajmi
                          </th>
                          <th className={`text-left px-3 py-3 ${theme.text}`}>
                            Qo‘shilgan vaqti
                          </th>
                          <th className={`text-center px-3 py-3 ${theme.text}`}>
                            Harakatlar
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {videosLoading && (
                          <tr>
                            <td
                              colSpan={7}
                              className={`px-3 py-6 text-center ${theme.soft}`}
                            >
                              Videolar yuklanmoqda...
                            </td>
                          </tr>
                        )}

                        {videos.map((video) => (
                          <tr
                            key={video.id}
                            className={`border-b ${theme.rowBorder} ${
                              darkMode
                                ? "hover:bg-slate-800/40"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            <td className={`px-3 py-3 ${theme.text}`}>
                              <div className="flex items-center gap-2">
                                <span className="text-emerald-500">◔</span>
                                {video.file ? (
                                  <a
                                    href={video.file}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="underline cursor-pointer"
                                  >
                                    {video.name}
                                  </a>
                                ) : (
                                  <span>{video.name}</span>
                                )}
                              </div>
                            </td>
                            <td className={`px-3 py-3 ${theme.text}`}>
                              {video.lessonName}
                            </td>
                            <td className="px-3 py-3">
                              <span className="px-2 py-1 rounded-full text-[11px] bg-emerald-100 text-emerald-700">
                                {video.status}
                              </span>
                            </td>
                            <td className={`px-3 py-3 ${theme.text}`}>
                              {video.lessonDate}
                            </td>
                            <td className={`px-3 py-3 ${theme.text}`}>
                              {video.size}
                            </td>
                            <td className={`px-3 py-3 ${theme.text}`}>
                              {video.uploadedAt}
                            </td>
                            <td
                              className={`px-3 py-3 text-center ${theme.soft}`}
                            >
                              -
                            </td>
                          </tr>
                        ))}

                        {videos.length === 0 && (
                          <tr>
                            <td
                              colSpan={7}
                              className={`px-3 py-10 text-center ${theme.soft}`}
                            >
                              Videolar hozircha yo‘q
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeMainTab === "guruh-darsliklari" &&
            lessonPage === "create-homework" && (
              <div
                className={`${theme.card} border rounded-2xl shadow-sm flex-1 min-h-0 overflow-auto p-4 sm:p-6`}
              >
                <div className="max-w-4xl mx-auto">
                  <button
                    onClick={() => setLessonPage("list")}
                    className={`mb-6 ${theme.soft} hover:opacity-80 text-sm`}
                  >
                    ← Orqaga
                  </button>

                  <h2 className={`text-2xl font-bold mb-6 ${theme.text}`}>
                    Yangi uyga vazifa yaratish
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <label
                        className={`block text-sm font-medium mb-2 ${theme.text}`}
                      >
                        * Dars
                      </label>
                      <select
                        className={inputClass}
                        value={homeworkForm.lessonId}
                        onChange={(e) =>
                          setHomeworkForm({
                            ...homeworkForm,
                            lessonId: e.target.value,
                            title:
                              lessons.find(
                                (lesson) =>
                                  Number(lesson.id) === Number(e.target.value),
                              )?.title || homeworkForm.title,
                          })
                        }
                      >
                        <option value="">Darslardan birini tanlang</option>
                        {lessons.map((lesson) => (
                          <option key={lesson.id} value={lesson.id}>
                            {lesson.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium mb-2 ${theme.text}`}
                      >
                        * Sarlavha
                      </label>
                      <input
                        className={inputClass}
                        placeholder="Uyga vazifa sarlavhasi"
                        value={homeworkForm.title}
                        onChange={(e) =>
                          setHomeworkForm({
                            ...homeworkForm,
                            title: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium mb-2 ${theme.text}`}
                      >
                        Tugash muddati (soat)
                      </label>
                      <input
                        type="number"
                        min="1"
                        className={inputClass}
                        value={homeworkForm.durationTime}
                        onChange={(e) =>
                          setHomeworkForm({
                            ...homeworkForm,
                            durationTime: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium mb-2 ${theme.text}`}
                      >
                        Fayl yuklash
                      </label>

                      <label
                        className={`flex items-center justify-center w-full rounded-xl border border-dashed ${innerBorderClass} px-4 py-6 cursor-pointer ${darkMode ? "hover:bg-slate-800" : "hover:bg-slate-50"}`}
                      >
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) =>
                            setHomeworkForm({
                              ...homeworkForm,
                              file: e.target.files?.[0] || null,
                            })
                          }
                        />
                        <span className={theme.soft}>
                          ⬇ Yuklash{" "}
                          {homeworkForm.file?.name
                            ? `- ${homeworkForm.file.name}`
                            : ""}
                        </span>
                      </label>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        onClick={() => setLessonPage("list")}
                        className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                      >
                        Bekor qilish
                      </button>

                      <button
                        disabled={homeworkSaving}
                        onClick={addHomework}
                        className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-60"
                      >
                        {homeworkSaving ? "Saqlanmoqda..." : "E'lon qilish"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {showEditModal && (
            <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
              <div
                className={`${theme.card} w-full max-w-xl rounded-2xl border p-4 shadow-xl`}
              >
                <h3 className={`text-lg font-semibold mb-4 ${theme.text}`}>
                  Guruhni tahrirlash
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    className={inputClass}
                    placeholder="Guruh nomi"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                  />
                  <input
                    className={inputClass}
                    placeholder="Kurs nomi"
                    value={editForm.course}
                    onChange={(e) =>
                      setEditForm({ ...editForm, course: e.target.value })
                    }
                  />
                  <input
                    className={inputClass}
                    placeholder="Narxi"
                    value={editForm.price}
                    onChange={(e) =>
                      setEditForm({ ...editForm, price: e.target.value })
                    }
                  />
                  <input
                    className={inputClass}
                    placeholder="Vaqti"
                    value={editForm.time}
                    onChange={(e) =>
                      setEditForm({ ...editForm, time: e.target.value })
                    }
                  />
                  <input
                    className={inputClass}
                    placeholder="Davomiyligi"
                    value={editForm.duration}
                    onChange={(e) =>
                      setEditForm({ ...editForm, duration: e.target.value })
                    }
                  />
                  <input
                    className={inputClass}
                    placeholder="Xona"
                    value={editForm.room}
                    onChange={(e) =>
                      setEditForm({ ...editForm, room: e.target.value })
                    }
                  />
                </div>

                <div className="mt-3">
                  <input
                    className={inputClass}
                    placeholder="Kunlar (vergul bilan)"
                    value={editForm.days}
                    onChange={(e) =>
                      setEditForm({ ...editForm, days: e.target.value })
                    }
                  />
                </div>

                <div className="mt-3">
                  <select
                    className={inputClass}
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm({ ...editForm, status: e.target.value })
                    }
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="FREEZE">FREEZE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className={actionBtnClass}
                  >
                    Bekor qilish
                  </button>
                  <button
                    onClick={saveGroupEdit}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm"
                  >
                    Saqlash
                  </button>
                </div>
              </div>
            </div>
          )}

          {showTeacherModal && (
            <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
              <div
                className={`${theme.card} w-full max-w-md rounded-2xl border p-4 shadow-xl`}
              >
                <h3 className={`text-lg font-semibold mb-4 ${theme.text}`}>
                  O‘qituvchi qo‘shish
                </h3>

                <div className="space-y-3">
                  <select
                    className={inputClass}
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    disabled={teacherOptionsLoading || teacherAssigning}
                  >
                    <option value="">
                      {teacherOptionsLoading
                        ? "O‘qituvchilar yuklanmoqda..."
                        : "O‘qituvchini tanlang"}
                    </option>
                    {teacherOptions.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setShowTeacherModal(false)}
                    className={actionBtnClass}
                  >
                    Bekor qilish
                  </button>
                  <button
                    onClick={addTeacher}
                    disabled={teacherAssigning || teacherOptionsLoading}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-60"
                  >
                    {teacherAssigning ? "Biriktirilmoqda..." : "Qo‘shish"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {showStudentModal && (
            <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
              <div
                className={`${theme.card} w-full max-w-md rounded-2xl border p-4 shadow-xl`}
              >
                <h3 className={`text-lg font-semibold mb-4 ${theme.text}`}>
                  O‘quvchi qo‘shish
                </h3>

                <div className="space-y-3">
                  <select
                    className={inputClass}
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    disabled={studentOptionsLoading || studentAssigning}
                  >
                    <option value="">
                      {studentOptionsLoading
                        ? "Talabalar yuklanmoqda..."
                        : "Talabani tanlang"}
                    </option>
                    {studentOptions.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.fullName}
                      </option>
                    ))}
                  </select>

                  {!studentOptionsLoading && studentOptions.length === 0 && (
                    <p className={`text-sm ${theme.soft}`}>
                      Qo‘shish uchun bo‘sh talaba topilmadi.
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setShowStudentModal(false)}
                    className={actionBtnClass}
                  >
                    Bekor qilish
                  </button>
                  <button
                    disabled={studentAssigning || studentOptionsLoading}
                    onClick={addStudent}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-60"
                  >
                    {studentAssigning ? "Qo‘shilmoqda..." : "Qo‘shish"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showVideoUploadModal && (
        <div className="fixed inset-0 z-70 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-6xl rounded-2xl shadow-xl border p-5 relative">
            <button
              onClick={() => setShowVideoUploadModal(false)}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 text-2xl"
            >
              ×
            </button>

            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Qo'shish
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Darsni tanlang
              </label>
              <select
                value={videoLessonId}
                onChange={(e) => setVideoLessonId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">Darslardan birini tanlang</option>
                {lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.title}
                  </option>
                ))}
              </select>
            </div>

            <div
              onClick={() => {
                if (!videoLessonId || videoUploading) return;
                fileRef.current?.click();
              }}
              className="border-2 border-dashed border-emerald-300 rounded-2xl p-10 sm:p-16 text-center cursor-pointer hover:bg-slate-50"
            >
              <div className="text-emerald-500 text-4xl mb-4">🧰</div>
              <p className="text-slate-700 text-base font-medium">
                Videofaylni yuklash uchun ushbu hudud ustiga bosing yoki faylni
                shu yerga olib keling
              </p>
              {!videoLessonId && (
                <p className="text-red-500 text-sm mt-2">
                  Avval darsni tanlang
                </p>
              )}
              <p className="text-slate-400 text-sm mt-2">
                Videofayl .mp4, .webm, .mpeg, .avi, .mkv, .mov formatlaridan
                birida bo‘lishi kerak
              </p>

              <input
                ref={fileRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => handleVideoUpload(e.target.files?.[0])}
              />
            </div>

            <div className="flex justify-end mt-5">
              <button
                disabled={videoUploading}
                onClick={() => setShowVideoUploadModal(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-60"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedHomework && (
        <HomeworkDetailPage
          homework={selectedHomework}
          onBack={() => setSelectedHomework(null)}
        />
      )}
    </>
  );
}
