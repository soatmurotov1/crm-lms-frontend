import { useEffect, useMemo, useRef, useState } from "react";
import HomeworkDetailPage from "./HomeworkDetailPage";
import { groupsApi } from "../api/crmApi";

const makeDateHeaders = () => {
  return [
    { day: "Fri", num: 20 },
    { day: "Sat", num: 21 },
    { day: "Sun", num: 22 },
    { day: "Mon", num: 23 },
    { day: "Tue", num: 24 },
    { day: "Wed", num: 25 },
    { day: "Thu", num: 26 },
    { day: "Fri", num: 27 },
    { day: "Sat", num: 28 },
  ];
};

const defaultStudents = [];

const defaultTeachers = [{ id: 1, name: "Jinibijoev", phone: "+998912879856" }];

const defaultHomeworkStudents = [
  {
    id: 1,
    name: "Sardor Xushvaqtov Bahodir o'g'li",
    sentAt: "11 Mart, 2026 14:50",
    status: "kutayotgan",
  },
  {
    id: 2,
    name: "Jamoliddin Maxammadibrohimov Xusniddin o'g'li",
    sentAt: "10 Mart, 2026 17:22",
    status: "kutayotgan",
  },
  {
    id: 3,
    name: "Abrorbek Soatmurotov Alimboy o'g'li",
    sentAt: "10 Mart, 2026 13:36",
    status: "kutayotgan",
  },
  {
    id: 4,
    name: "Dilshod Olimov Farhod o'g'li",
    sentAt: "10 Mart, 2026 15:39",
    status: "kutayotgan",
  },
  {
    id: 5,
    name: "Bunyodbek G'ulomjonov",
    sentAt: "11 Mart, 2026 10:16",
    status: "kutayotgan",
  },
  {
    id: 6,
    name: "Axrorbek Mengilov",
    sentAt: "10 Mart, 2026 19:53",
    status: "kutayotgan",
  },
  {
    id: 7,
    name: "Sirojiddin Oyosboyev",
    sentAt: "10 Mart, 2026 13:54",
    status: "qabul",
  },
  {
    id: 8,
    name: "Olimjon Murtozoyev",
    sentAt: "11 Mart, 2026 09:25",
    status: "qabul",
  },
  {
    id: 9,
    name: "Sabina Norbekova",
    sentAt: "10 Mart, 2026 17:33",
    status: "qaytarilgan",
  },
  {
    id: 10,
    name: "Qo'chqorboyev Abbos Abulqosim o'g'li",
    sentAt: "10 Mart, 2026 19:52",
    status: "bajarilmagan",
  },
  { id: 11, name: "Murodjon Soliyev", sentAt: "-", status: "bajarilmagan" },
];

const defaultHomeworks = [
  {
    id: 1,
    title: "crm continue backend finish",
    total: 15,
    submitted: 11,
    checked: 0,
    assignedAt: "10 Mart, 2026 09:30",
    deadline: "11 Mart, 2026 01:30",
    lessonDate: "09 Mart, 2026",
    description: "Backendni tugatish",
    studentStatuses: defaultHomeworkStudents,
  },
  {
    id: 2,
    title: "crm project continue",
    total: 15,
    submitted: 11,
    checked: 0,
    assignedAt: "04 Mart, 2026 21:39",
    deadline: "05 Mart, 2026 13:39",
    lessonDate: "04 Mart, 2026",
    description: "Project davom ettirish",
    studentStatuses: defaultHomeworkStudents,
  },
  {
    id: 3,
    title: "React continue, nested route, NavLink",
    total: 15,
    submitted: 12,
    checked: 0,
    assignedAt: "25 Fev, 2026 23:10",
    deadline: "26 Fev, 2026 15:10",
    lessonDate: "25 Fev, 2026",
    description: "Nested route va NavLink",
    studentStatuses: defaultHomeworkStudents,
  },
];

const defaultVideos = [
  {
    id: 1,
    name: "62.2.mov",
    lessonName: "crm continue",
    status: "Tayyor",
    lessonDate: "10 Mart, 2026",
    size: "2.77 GB",
    uploadedAt: "10 Mart, 2026",
  },
  {
    id: 2,
    name: "62.1.mov",
    lessonName: "crm continue",
    status: "Tayyor",
    lessonDate: "10 Mart, 2026",
    size: "1.21 GB",
    uploadedAt: "10 Mart, 2026",
  },
  {
    id: 3,
    name: "61.2.mov",
    lessonName: "crm continue backend finish",
    status: "Tayyor",
    lessonDate: "09 Mart, 2026",
    size: "1.82 GB",
    uploadedAt: "10 Mart, 2026",
  },
  {
    id: 4,
    name: "61.1.mov",
    lessonName: "crm continue backend finish",
    status: "Tayyor",
    lessonDate: "09 Mart, 2026",
    size: "1.76 GB",
    uploadedAt: "10 Mart, 2026",
  },
  {
    id: 5,
    name: "60.1.mov",
    lessonName: "crm project continue lesson, studentGroup model",
    status: "Tayyor",
    lessonDate: "06 Mart, 2026",
    size: "1.37 GB",
    uploadedAt: "09 Mart, 2026",
  },
  {
    id: 6,
    name: "59.1.mov",
    lessonName: "crm project continue",
    status: "Tayyor",
    lessonDate: "05 Mart, 2026",
    size: "1.77 GB",
    uploadedAt: "06 Mart, 2026",
  },
];

const getInitial = (name = "") => name.trim().charAt(0).toUpperCase();

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
  const dateHeaders = useMemo(() => makeDateHeaders(), []);
  const fileRef = useRef(null);

  const [groupDeleted, setGroupDeleted] = useState(false);

  const [groupData, setGroupData] = useState(
    group || {
      name: "Bootcamp Full Stack (NodeJS+ReactJS) N25",
      course: "Backend",
      price: "0",
      days: ["Juma", "Chorshanba"],
      time: "09:00",
      duration: "90 minut",
      room: "2-xona",
    },
  );

  const [students, setStudents] = useState(group?.students || defaultStudents);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [teachers, setTeachers] = useState(
    group?.teacher
      ? [{ id: group?.teacherId || 1, name: group.teacher, phone: "-" }]
      : defaultTeachers,
  );
  const [homeworks, setHomeworks] = useState(defaultHomeworks);
  const [videos, setVideos] = useState(defaultVideos);

  const [attendance, setAttendance] = useState(() => {
    const result = {};
    defaultStudents.forEach((student) => {
      result[student.id] = {};
      makeDateHeaders().forEach((d) => {
        result[student.id][`${d.day}-${d.num}`] = "";
      });
    });
    result[1]["Fri-20"] = "Yo‘q";
    result[2]["Fri-20"] = "Bor";
    return result;
  });

  useEffect(() => {
    if (!group?.id) return;

    const loadStudents = async () => {
      try {
        setStudentsLoading(true);
        const result = await groupsApi.getStudentsByGroup(group.id);
        const list = Array.isArray(result?.data) ? result.data : [];
        setStudents(
          list.map((student) => ({
            id: student.id,
            name: student.fullName,
            phone: student.email || "-",
            active: true,
          })),
        );
      } catch {
        setStudents([]);
      } finally {
        setStudentsLoading(false);
      }
    };

    loadStudents();
  }, [group?.id]);

  useEffect(() => {
    setAttendance((prev) => {
      const next = {};

      students.forEach((student) => {
        next[student.id] = prev[student.id] || {};
        dateHeaders.forEach((d) => {
          const key = `${d.day}-${d.num}`;
          if (!(key in next[student.id])) {
            next[student.id][key] = "";
          }
        });
      });

      return next;
    });
  }, [students, dateHeaders]);

  const [activeMainTab, setActiveMainTab] = useState("malumotlar");
  const [activeLessonTab, setActiveLessonTab] = useState("uyga-vazifa");
  const [lessonPage, setLessonPage] = useState("list");

  const [showEditModal, setShowEditModal] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showVideoUploadModal, setShowVideoUploadModal] = useState(false);

  const [selectedHomework, setSelectedHomework] = useState(null);
  const [homeworkDetailTab, setHomeworkDetailTab] = useState("kutayotgan");

  const [editForm, setEditForm] = useState({
    name: groupData.name,
    course: groupData.course,
    price: groupData.price,
    days: Array.isArray(groupData.days) ? groupData.days.join(", ") : "",
    time: groupData.lessonTime || groupData.time,
    duration: groupData.duration,
    room: groupData.room,
  });

  const [teacherForm, setTeacherForm] = useState({
    name: "",
    phone: "",
  });

  const [studentForm, setStudentForm] = useState({
    name: "",
    phone: "",
  });

  const [homeworkForm, setHomeworkForm] = useState({
    title: "",
    description: "",
    fileName: "",
  });

  const actionBtnClass = darkMode
    ? "px-3 py-2 rounded-xl border border-slate-700 text-slate-200 hover:bg-slate-800 transition text-sm"
    : "px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition text-sm";

  const infoCardClass = `${theme.card} border rounded-2xl p-3 shadow-sm min-h-0`;
  const innerBorderClass = darkMode ? "border-slate-700" : "border-slate-200";

  const inputClass = darkMode
    ? "w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none"
    : "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none";

  const textareaClass = darkMode
    ? "w-full min-h-[180px] rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-slate-100 outline-none resize-none"
    : "w-full min-h-[180px] rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none resize-none";

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

  const toggleAttendance = (studentId, key) => {
    setAttendance((prev) => {
      const current = prev[studentId]?.[key] || "";
      const next = current === "" ? "Bor" : current === "Bor" ? "Yo‘q" : "";
      return {
        ...prev,
        [studentId]: {
          ...prev[studentId],
          [key]: next,
        },
      };
    });
  };

  const attendancePill = (value) => {
    if (value === "Bor")
      return "bg-emerald-500 text-white border border-emerald-500";
    if (value === "Yo‘q") return "bg-red-500 text-white border border-red-500";
    return darkMode
      ? "border border-slate-700 bg-slate-900 text-slate-300"
      : "border border-slate-200 bg-white text-slate-500";
  };

  const openEditModal = () => {
    setEditForm({
      name: groupData.name || "",
      course: groupData.course || "",
      price: groupData.price || "",
      days: Array.isArray(groupData.days) ? groupData.days.join(", ") : "",
      time: groupData.lessonTime || groupData.time || "",
      duration: groupData.duration || "",
      room: groupData.room || "",
    });
    setShowEditModal(true);
  };

  const saveGroupEdit = () => {
    setGroupData((prev) => ({
      ...prev,
      name: editForm.name,
      course: editForm.course,
      price: editForm.price,
      days: editForm.days
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      time: editForm.time,
      duration: editForm.duration,
      room: editForm.room,
    }));
    setShowEditModal(false);
  };

  const addTeacher = () => {
    if (!teacherForm.name.trim() || !teacherForm.phone.trim()) return;
    setTeachers((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: teacherForm.name.trim(),
        phone: teacherForm.phone.trim(),
      },
    ]);
    setTeacherForm({ name: "", phone: "" });
    setShowTeacherModal(false);
  };

  const addStudent = () => {
    if (!studentForm.name.trim() || !studentForm.phone.trim()) return;
    const newId = Date.now();

    setStudents((prev) => [
      ...prev,
      {
        id: newId,
        name: studentForm.name.trim(),
        phone: studentForm.phone.trim(),
        active: true,
      },
    ]);

    setAttendance((prev) => {
      const newAttendance = {};
      dateHeaders.forEach((d) => {
        newAttendance[`${d.day}-${d.num}`] = "";
      });
      return {
        ...prev,
        [newId]: newAttendance,
      };
    });

    setStudentForm({ name: "", phone: "" });
    setShowStudentModal(false);
  };

  const addHomework = () => {
    if (!homeworkForm.title.trim()) return;

    const today = new Date();
    const dateText = today.toLocaleDateString("uz-UZ");

    setHomeworks((prev) => [
      {
        id: Date.now(),
        title: homeworkForm.title.trim(),
        total: students.length,
        submitted: 0,
        checked: 0,
        assignedAt: dateText,
        deadline: "-",
        lessonDate: dateText,
        description: homeworkForm.description,
        fileName: homeworkForm.fileName,
        studentStatuses: defaultHomeworkStudents,
      },
      ...prev,
    ]);

    setHomeworkForm({
      title: "",
      description: "",
      fileName: "",
    });

    setLessonPage("list");
    setActiveLessonTab("uyga-vazifa");
  };

  const handleVideoUpload = (file) => {
    if (!file) return;

    const today = new Date().toLocaleDateString("uz-UZ");
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);

    setVideos((prev) => [
      {
        id: Date.now(),
        name: file.name,
        lessonName: "Yangi video",
        status: "Tayyor",
        lessonDate: today,
        size: `${sizeMb} MB`,
        uploadedAt: today,
      },
      ...prev,
    ]);

    setShowVideoUploadModal(false);
  };

  const openHomeworkDetail = (homework) => {
    setSelectedHomework(homework);
    setHomeworkDetailTab("kutayotgan");
  };

  const deleteTeacher = (id) => {
    setTeachers((prev) => prev.filter((item) => item.id !== id));
  };

  const deleteStudent = (id) => {
    setStudents((prev) => prev.filter((item) => item.id !== id));
    setAttendance((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const deleteHomework = (id) => {
    setHomeworks((prev) => prev.filter((item) => item.id !== id));
  };

  const deleteVideo = (id) => {
    setVideos((prev) => prev.filter((item) => item.id !== id));
  };

  const deleteGroup = () => {
    const isOk = window.confirm("Rostan ham guruhni o‘chirmoqchimisiz?");
    if (!isOk) return;
    setGroupDeleted(true);
  };

  const filteredHomeworkStudents =
    selectedHomework?.studentStatuses?.filter(
      (item) => item.status === homeworkDetailTab,
    ) || [];

  const getCountByStatus = (status) =>
    selectedHomework?.studentStatuses?.filter((item) => item.status === status)
      .length || 0;

  if (groupDeleted) {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center p-4 overflow-hidden">
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
      <div className="h-[100dvh] w-full overflow-hidden">
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
                  Guruh haqida batafsil ma’lumot
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={openEditModal} className={actionBtnClass}>
                ✏️ Tahrirlash
              </button>

              <button
                onClick={() => setShowTeacherModal(true)}
                className={actionBtnClass}
              >
                + O‘qituvchi qo‘shish
              </button>

              <button
                onClick={() => setShowStudentModal(true)}
                className={actionBtnClass}
              >
                + O‘quvchi qo‘shish
              </button>

              <button
                onClick={deleteGroup}
                className="w-10 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white transition shrink-0"
              >
                🗑️
              </button>
            </div>
          </div>

          <div
            className={`${theme.card} border rounded-2xl shadow-sm px-4 pt-4 shrink-0`}
          >
            <div className="flex items-center gap-6 sm:gap-8 overflow-x-auto">
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
            </div>
          </div>

          {activeMainTab === "malumotlar" && (
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
                      <p className={`font-medium break-words ${theme.text}`}>
                        {groupData.course}
                      </p>
                    </div>

                    <div>
                      <p className={theme.soft}>Kurs to‘lovi</p>
                      <p className={`font-medium break-words ${theme.text}`}>
                        {Number(groupData.price || 0).toLocaleString()} so‘m
                      </p>
                    </div>

                    <div>
                      <p className={theme.soft}>O‘tish kunlari</p>
                      <p className={`font-medium break-words ${theme.text}`}>
                        {(groupData.days || []).join(", ")}
                      </p>
                    </div>

                    <div>
                      <p className={theme.soft}>O‘tish vaqti</p>
                      <p className={`font-medium break-words ${theme.text}`}>
                        {groupData.lessonTime || groupData.time}
                      </p>
                    </div>

                    <div>
                      <p className={theme.soft}>O‘qish davomiyligi</p>
                      <p className={`font-medium break-words ${theme.text}`}>
                        {groupData.duration}
                      </p>
                    </div>

                    <div>
                      <p className={theme.soft}>Xona</p>
                      <p className={`font-medium break-words ${theme.text}`}>
                        {groupData.room}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={infoCardClass}>
                  <h3
                    className={`text-sm sm:text-base font-semibold mb-3 ${theme.text}`}
                  >
                    O‘qituvchilar
                  </h3>

                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {teachers.map((teacher) => (
                      <div
                        key={teacher.id}
                        className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 min-w-0 ${innerBorderClass}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 ${
                              darkMode
                                ? "bg-slate-800 text-slate-200"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {getInitial(teacher.name)}
                          </div>

                          <div className="min-w-0">
                            <p
                              className={`text-sm font-medium truncate ${theme.text}`}
                            >
                              {teacher.name}
                            </p>
                            <p className={`text-xs truncate ${theme.soft}`}>
                              {teacher.phone}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => deleteTeacher(teacher.id)}
                          className="text-red-500 text-sm shrink-0"
                        >
                          O‘chirish
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`${infoCardClass} flex-1 overflow-hidden`}>
                  <h3
                    className={`text-sm sm:text-base font-semibold mb-3 ${theme.text}`}
                  >
                    Talabalar
                  </h3>

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
                        <div
                          key={student.id}
                          className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 min-w-0 ${innerBorderClass}`}
                        >
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
                                className={`text-sm font-medium truncate ${theme.text}`}
                              >
                                {student.name}
                              </p>
                              <p className={`text-xs truncate ${theme.soft}`}>
                                {student.phone}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="px-2 py-1 rounded-full text-[10px] bg-emerald-100 text-emerald-700">
                              Faol
                            </span>
                            <button
                              onClick={() => deleteStudent(student.id)}
                              className="text-red-500 text-xs"
                            >
                              O‘chirish
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

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
                    2026 Fevral
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
                            className={`text-left px-3 py-3 w-[260px] ${theme.text}`}
                          >
                            Nomi
                          </th>

                          {dateHeaders.map((item) => (
                            <th
                              key={`${item.day}-${item.num}`}
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
                              const key = `${item.day}-${item.num}`;
                              const value = attendance[student.id]?.[key] || "";

                              return (
                                <td key={key} className="px-1 py-2 text-center">
                                  <button
                                    onClick={() =>
                                      toggleAttendance(student.id, key)
                                    }
                                    className={`w-full max-w-[64px] h-10 rounded-full text-[11px] font-medium transition ${attendancePill(value)}`}
                                  >
                                    {value || ""}
                                  </button>
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
                            <p className={`font-medium truncate ${theme.text}`}>
                              {student.name}
                            </p>
                            <p className={`text-xs truncate ${theme.soft}`}>
                              {student.phone}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {dateHeaders.map((item) => {
                            const key = `${item.day}-${item.num}`;
                            const value = attendance[student.id]?.[key] || "";

                            return (
                              <button
                                key={key}
                                onClick={() =>
                                  toggleAttendance(student.id, key)
                                }
                                className={`rounded-xl px-2 py-2 text-xs font-medium transition ${attendancePill(value)}`}
                              >
                                <div>{item.day}</div>
                                <div className="font-bold">{item.num}</div>
                                <div>{value || "-"}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
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

                {activeLessonTab === "uyga-vazifa" ? (
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
                {activeLessonTab === "uyga-vazifa" && (
                  <div className="overflow-auto">
                    <table className="w-full min-w-[980px] text-sm">
                      <thead
                        className={darkMode ? "bg-slate-800" : "bg-slate-50"}
                      >
                        <tr className={`border-b ${innerBorderClass}`}>
                          <th
                            className={`text-left px-3 py-3 w-[50px] ${theme.text}`}
                          >
                            #
                          </th>
                          <th className={`text-left px-3 py-3 ${theme.text}`}>
                            Mavzu
                          </th>
                          <th
                            className={`text-center px-3 py-3 w-[90px] ${theme.text}`}
                          >
                            👤
                          </th>
                          <th
                            className={`text-center px-3 py-3 w-[90px] ${theme.text}`}
                          >
                            🟡
                          </th>
                          <th
                            className={`text-center px-3 py-3 w-[90px] ${theme.text}`}
                          >
                            🟢
                          </th>
                          <th
                            className={`text-left px-3 py-3 w-[180px] ${theme.text}`}
                          >
                            Berilgan vaqt
                          </th>
                          <th
                            className={`text-left px-3 py-3 w-[180px] ${theme.text}`}
                          >
                            Tugash vaqti
                          </th>
                          <th
                            className={`text-left px-3 py-3 w-[150px] ${theme.text}`}
                          >
                            Dars sanasi
                          </th>
                          <th
                            className={`text-center px-3 py-3 w-[90px] ${theme.text}`}
                          >
                            Amal
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {homeworks.map((item, index) => (
                          <tr
                            key={item.id}
                            className={`border-b ${theme.rowBorder} ${
                              darkMode
                                ? "hover:bg-slate-800/40"
                                : "hover:bg-slate-50"
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
                                onClick={() => deleteHomework(item.id)}
                                className="text-red-500 text-xs"
                              >
                                O‘chirish
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
                    <table className="w-full min-w-[1100px] text-sm">
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
                                <span className="underline cursor-pointer">
                                  {video.name}
                                </span>
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
                            <td className="px-3 py-3 text-center">
                              <button
                                onClick={() => deleteVideo(video.id)}
                                className="text-red-500 text-xs"
                              >
                                O‘chirish
                              </button>
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
                        * Mavzu
                      </label>
                      <select
                        className={inputClass}
                        value={homeworkForm.title}
                        onChange={(e) =>
                          setHomeworkForm({
                            ...homeworkForm,
                            title: e.target.value,
                          })
                        }
                      >
                        <option value="">Mavzulardan birini tanlang</option>
                        <option value="crm continue backend finish">
                          crm continue backend finish
                        </option>
                        <option value="crm project continue">
                          crm project continue
                        </option>
                        <option value="React continue, nested route, NavLink">
                          React continue, nested route, NavLink
                        </option>
                        <option value="React hooks">React hooks</option>
                        <option value="Custom vazifa">Custom vazifa</option>
                      </select>
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium mb-2 ${theme.text}`}
                      >
                        * Izoh
                      </label>

                      <div
                        className={`rounded-xl border ${innerBorderClass} overflow-hidden`}
                      >
                        <div
                          className={`${darkMode ? "bg-slate-800" : "bg-slate-50"} px-3 py-2 border-b ${innerBorderClass} flex items-center gap-4 text-sm`}
                        >
                          <span>H1</span>
                          <span>H2</span>
                          <span>Sans Serif</span>
                          <span>Normal</span>
                          <span>B</span>
                          <span>I</span>
                          <span>U</span>
                          <span>S</span>
                          <span>❝</span>
                          <span>{"</>"}</span>
                        </div>

                        <textarea
                          className={textareaClass}
                          placeholder="Uyga vazifa izohi..."
                          value={homeworkForm.description}
                          onChange={(e) =>
                            setHomeworkForm({
                              ...homeworkForm,
                              description: e.target.value,
                            })
                          }
                        />
                      </div>
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
                              fileName: e.target.files?.[0]?.name || "",
                            })
                          }
                        />
                        <span className={theme.soft}>
                          ⬇ Yuklash{" "}
                          {homeworkForm.fileName
                            ? `- ${homeworkForm.fileName}`
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
                        onClick={addHomework}
                        className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white"
                      >
                        E&apos;lon qilish
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
                  <input
                    className={inputClass}
                    placeholder="O‘qituvchi ismi"
                    value={teacherForm.name}
                    onChange={(e) =>
                      setTeacherForm({ ...teacherForm, name: e.target.value })
                    }
                  />
                  <input
                    className={inputClass}
                    placeholder="Telefon raqami"
                    value={teacherForm.phone}
                    onChange={(e) =>
                      setTeacherForm({ ...teacherForm, phone: e.target.value })
                    }
                  />
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
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm"
                  >
                    Qo‘shish
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
                  <input
                    className={inputClass}
                    placeholder="O‘quvchi ismi"
                    value={studentForm.name}
                    onChange={(e) =>
                      setStudentForm({ ...studentForm, name: e.target.value })
                    }
                  />
                  <input
                    className={inputClass}
                    placeholder="Telefon raqami"
                    value={studentForm.phone}
                    onChange={(e) =>
                      setStudentForm({ ...studentForm, phone: e.target.value })
                    }
                  />
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setShowStudentModal(false)}
                    className={actionBtnClass}
                  >
                    Bekor qilish
                  </button>
                  <button
                    onClick={addStudent}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm"
                  >
                    Qo‘shish
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showVideoUploadModal && (
        <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4">
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

            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-emerald-300 rounded-2xl p-10 sm:p-16 text-center cursor-pointer hover:bg-slate-50"
            >
              <div className="text-emerald-500 text-4xl mb-4">🧰</div>
              <p className="text-slate-700 text-base font-medium">
                Videofaylni yuklash uchun ushbu hudud ustiga bosing yoki faylni
                shu yerga olib keling
              </p>
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
                onClick={() => setShowVideoUploadModal(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
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
