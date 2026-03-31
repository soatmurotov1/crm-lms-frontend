import { useEffect, useMemo, useState } from "react";
import {
  coursesApi,
  groupsApi,
  roomsApi,
  studentGroupApi,
  studentsApi,
  teachersApi,
} from "../../api/crmApi";
import { toInputDate } from "../../utils/date";

const WEEK_DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const dayLabel = {
  MONDAY: "Dushanba",
  TUESDAY: "Seshanba",
  WEDNESDAY: "Chorshanba",
  THURSDAY: "Payshanba",
  FRIDAY: "Juma",
  SATURDAY: "Shanba",
  SUNDAY: "Yakshanba",
};

const normalizeStatus = (status) => {
  const normalized = String(status || "ACTIVE")
    .trim()
    .toUpperCase();

  if (normalized === "FREEZE" || normalized === "FROZEN") return "FREEZE";
  if (normalized === "INACTIVE" || normalized === "ARCHIVE") {
    return "INACTIVE";
  }

  return "ACTIVE";
};

export default function GroupsPage({
  theme,
  darkMode,
  onOpenGroupDetails,
  currentUser,
}) {
  const [groups, setGroups] = useState([]);
  const [courses, setCourses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("ACTIVE");
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    courseId: "",
    roomId: "",
    teacherId: "",
    startDate: "",
    startTime: "09:00",
    weekDays: [],
    status: "ACTIVE",
  });

  const coursesById = useMemo(
    () => Object.fromEntries(courses.map((c) => [c.id, c])),
    [courses],
  );
  const roomsById = useMemo(
    () => Object.fromEntries(rooms.map((r) => [r.id, r])),
    [rooms],
  );
  const teachersById = useMemo(
    () => Object.fromEntries(teachers.map((t) => [t.id, t])),
    [teachers],
  );
  const teacherIdSet = useMemo(
    () => new Set(teachers.map((teacher) => String(teacher.id))),
    [teachers],
  );
  const studentIdSet = useMemo(
    () => new Set(students.map((student) => String(student.id))),
    [students],
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const [groupsRes, coursesRes, roomsRes, teachersRes, studentsRes] =
        await Promise.allSettled([
          groupsApi.getAll(),
          coursesApi.getAll(),
          roomsApi.getAll(),
          teachersApi.getAll(),
          studentsApi.getAll(),
        ]);

      const groupsList =
        groupsRes.status === "fulfilled" && Array.isArray(groupsRes.value?.data)
          ? groupsRes.value.data
          : [];
      const groupsWithCounts = await Promise.all(
        groupsList.map(async (group) => {
          try {
            const studentsRes = await groupsApi.getStudentsByGroup(group.id);
            const count = Array.isArray(studentsRes?.data)
              ? studentsRes.data.length
              : 0;
            return {
              ...group,
              studentsCount: count,
            };
          } catch {
            return {
              ...group,
              studentsCount: Number(
                group.studentsCount ??
                  group.studentCount ??
                  group.students?.length ??
                  0,
              ),
            };
          }
        }),
      );
      const isTeacher = currentUser?.role === "TEACHER";

      setGroups(
        isTeacher
          ? groupsWithCounts.filter(
              (group) => Number(group.teacherId) === Number(currentUser?.id),
            )
          : groupsWithCounts,
      );
      setCourses(
        coursesRes.status === "fulfilled" &&
          Array.isArray(coursesRes.value?.data)
          ? coursesRes.value.data
          : [],
      );
      setRooms(
        roomsRes.status === "fulfilled" && Array.isArray(roomsRes.value?.data)
          ? roomsRes.value.data
          : [],
      );
      setTeachers(
        teachersRes.status === "fulfilled" &&
          Array.isArray(teachersRes.value?.data)
          ? teachersRes.value.data
          : [],
      );
      setStudents(
        studentsRes.status === "fulfilled" &&
          Array.isArray(studentsRes.value?.data)
          ? studentsRes.value.data
          : [],
      );
    } catch (error) {
      setGroups([]);
      setCourses([]);
      setRooms([]);
      setTeachers([]);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser?.id, currentUser?.role]);

  const tabGroups = useMemo(() => {
    if (activeTab === "FREEZE") {
      return groups.filter(
        (group) => normalizeStatus(group.status) === "FREEZE",
      );
    }

    if (activeTab === "ARCHIVE") {
      return groups.filter(
        (group) => normalizeStatus(group.status) === "INACTIVE",
      );
    }

    return groups.filter((group) => normalizeStatus(group.status) === "ACTIVE");
  }, [groups, activeTab]);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tabGroups;

    return tabGroups.filter((group) => {
      const courseName = coursesById[group.courseId]?.name || "";
      const teacherName =
        teachersById[group.teacherId]?.fullName ||
        (Number(group.teacherId) === Number(currentUser?.id)
          ? currentUser?.fullName || ""
          : "");
      const roomName = roomsById[group.roomId]?.name || "";
      return (
        String(group.name || "")
          .toLowerCase()
          .includes(q) ||
        String(courseName).toLowerCase().includes(q) ||
        String(teacherName).toLowerCase().includes(q) ||
        String(roomName).toLowerCase().includes(q)
      );
    });
  }, [tabGroups, search, coursesById, teachersById, roomsById, currentUser]);

  const activeGroupsCount = useMemo(() => tabGroups.length, [tabGroups]);

  const groupTeachersCount = useMemo(
    () =>
      new Set(
        tabGroups
          .map((group) => group.teacherId)
          .filter((teacherId) => teacherId !== undefined && teacherId !== null),
      ).size,
    [tabGroups],
  );

  const totalStudents = useMemo(
    () =>
      tabGroups.reduce(
        (sum, group) =>
          sum +
          Number(
            group.studentsCount ??
              group.studentCount ??
              group.students?.length ??
              0,
          ),
        0,
      ),
    [tabGroups],
  );

  const getTeacherName = (group) =>
    teachersById[group.teacherId]?.fullName ||
    (Number(group.teacherId) === Number(currentUser?.id)
      ? currentUser?.fullName || "-"
      : "O'qituvchi yo'q");

  const getStatusBadgeClass = (status) => {
    const normalized = normalizeStatus(status);

    if (normalized === "FREEZE") {
      return darkMode
        ? "bg-amber-500/20 text-amber-300"
        : "bg-amber-100 text-amber-700";
    }
    if (normalized === "INACTIVE") {
      return darkMode
        ? "bg-rose-500/20 text-rose-300"
        : "bg-rose-100 text-rose-700";
    }
    return darkMode
      ? "bg-emerald-500/20 text-emerald-300"
      : "bg-emerald-100 text-emerald-700";
  };

  const getStatusLabel = (status) => {
    const normalized = normalizeStatus(status);

    if (normalized === "FREEZE") return "FREEZE";
    if (normalized === "INACTIVE") return "INACTIVE";
    return "ACTIVE";
  };

  const resetForm = () => {
    setEditingGroupId(null);
    setSelectedTeacherIds([]);
    setSelectedStudentIds([]);
    setFormData({
      name: "",
      courseId: "",
      roomId: "",
      teacherId: "",
      startDate: "",
      startTime: "09:00",
      weekDays: [],
      status: "ACTIVE",
    });
  };

  const openAddDrawer = () => {
    resetForm();
    setShowDrawer(true);
  };

  const openEditDrawer = (group) => {
    setEditingGroupId(group.id);
    setSelectedTeacherIds(group.teacherId ? [String(group.teacherId)] : []);
    setSelectedStudentIds([]);
    setFormData({
      name: group.name || "",
      courseId: String(group.courseId || ""),
      roomId: String(group.roomId || ""),
      teacherId: String(group.teacherId || ""),
      startDate: toInputDate(group.startDate),
      startTime: group.startTime || "09:00",
      weekDays: Array.isArray(group.weekDays) ? group.weekDays : [],
      status: group.status || "ACTIVE",
    });
    setShowDrawer(true);
  };

  const closeDrawer = () => {
    setShowDrawer(false);
    resetForm();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTeacherMultiChange = (e) => {
    const ids = Array.from(e.target.selectedOptions || []).map(
      (option) => option.value,
    );
    setSelectedTeacherIds(ids);
  };

  const toggleStudentSelection = (studentId) => {
    const targetId = String(studentId);
    setSelectedStudentIds((prev) =>
      prev.includes(targetId)
        ? prev.filter((id) => id !== targetId)
        : [...prev, targetId],
    );
  };

  const toggleWeekDay = (day) => {
    setFormData((prev) => ({
      ...prev,
      weekDays: prev.weekDays.includes(day)
        ? prev.weekDays.filter((d) => d !== day)
        : [...prev.weekDays, day],
    }));
  };

  const handleSave = async () => {
    if (
      !formData.name.trim() ||
      !formData.courseId ||
      !formData.roomId ||
      !formData.startDate ||
      !formData.startTime ||
      !formData.weekDays.length
    ) {
      alert("Majburiy maydonlarni to'ldiring");
      return;
    }

    try {
      setSaving(true);
      const validTeacherIds = selectedTeacherIds.filter((id) =>
        teacherIdSet.has(String(id)),
      );
      const teacherIdToUse = validTeacherIds[0] || "";
      const validStudentIds = [...new Set(selectedStudentIds)].filter((id) =>
        studentIdSet.has(String(id)),
      );

      if (!teacherIdToUse) {
        alert("Kamida bitta o'qituvchini tanlang");
        return;
      }

      const payload = {
        name: formData.name.trim(),
        courseId: Number(formData.courseId),
        roomId: Number(formData.roomId),
        teacherId: Number(teacherIdToUse),
        startDate: formData.startDate,
        startTime: formData.startTime,
        weekDays: formData.weekDays,
        status: formData.status,
      };

      if (editingGroupId !== null) {
        await groupsApi.update(editingGroupId, payload);

        if (validStudentIds.length > 0) {
          await Promise.allSettled(
            validStudentIds.map((studentId) =>
              studentGroupApi.create({
                groupId: Number(editingGroupId),
                studentId: Number(studentId),
              }),
            ),
          );
        }
      } else {
        const createResult = await groupsApi.create(payload);
        let createdGroupId = Number(
          createResult?.data?.id || createResult?.id || 0,
        );

        if (!createdGroupId) {
          const groupsResult = await groupsApi.getAll();
          const list = Array.isArray(groupsResult?.data)
            ? groupsResult.data
            : [];
          const createdGroup = list.find(
            (item) =>
              String(item.name || "").toLowerCase() ===
                String(formData.name || "")
                  .trim()
                  .toLowerCase() &&
              Number(item.courseId) === Number(formData.courseId),
          );
          createdGroupId = Number(createdGroup?.id || 0);
        }

        if (createdGroupId && validStudentIds.length > 0) {
          await Promise.allSettled(
            validStudentIds.map((studentId) =>
              studentGroupApi.create({
                groupId: createdGroupId,
                studentId: Number(studentId),
              }),
            ),
          );
        }
      }

      await loadData();
      closeDrawer();
    } catch (error) {
      alert(error?.response?.data?.message || "Guruhni saqlashda xato");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const isOk = window.confirm("Rostdan ham guruhni o'chirmoqchimisiz?");
    if (!isOk) return;

    try {
      await groupsApi.remove(id);
      await loadData();
      setOpenActionMenuId(null);
    } catch (error) {
      alert(error?.response?.data?.message || "Guruhni o'chirishda xato");
    }
  };

  const handleOpenGroupDetails = async (
    group,
    course,
    roomName,
    options = {},
  ) => {
    let preloadedStudents = [];

    try {
      const studentsRes = await groupsApi.getStudentsByGroup(group.id);
      preloadedStudents = Array.isArray(studentsRes?.data)
        ? studentsRes.data.map((student) => ({
            id: student.id,
            fullName: student.fullName,
            email: student.email || "-",
          }))
        : [];
    } catch {
      preloadedStudents = [];
    }

    onOpenGroupDetails?.({
      id: group.id,
      name: group.name,
      status: group.status,
      course: course?.name || "-",
      courseId: group.courseId,
      teacher: getTeacherName(group),
      teacherId: group.teacherId,
      room: roomName,
      roomId: group.roomId,
      lessonTime: group.startTime,
      days: group.weekDays || [],
      duration: course?.durationLesson ? `${course.durationLesson} minut` : "-",
      startDate: group.startDate,
      startTime: group.startTime,
      students: preloadedStudents,
      initialMainTab: options.initialMainTab,
    });
  };

  return (
    <div className="space-y-6 w-full min-w-0 overflow-x-hidden">
      <div className={`${theme.card} border rounded-2xl p-5 shadow-sm`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-5">
          <div>
            <h2 className={`text-3xl font-bold ${theme.text}`}>Guruhlar</h2>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => setActiveTab("ACTIVE")}
                className={`px-3 py-1.5 text-sm rounded-lg border ${
                  activeTab === "ACTIVE" ? theme.tabActive : theme.tab
                } cursor-pointer`}
              >
                Asosiy
              </button>
              <button
                onClick={() => setActiveTab("FREEZE")}
                className={`px-3 py-1.5 text-sm rounded-lg border ${
                  activeTab === "FREEZE" ? theme.tabActive : theme.tab
                } cursor-pointer`}
              >
                Muzlatilganlar
              </button>
              <button
                onClick={() => setActiveTab("ARCHIVE")}
                className={`px-3 py-1.5 text-sm rounded-lg border ${
                  activeTab === "ARCHIVE" ? theme.tabActive : theme.tab
                } cursor-pointer`}
              >
                Arxivdagilar
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Qidirish..."
              className={`rounded-xl border px-4 py-2.5 min-w-56 ${theme.input}`}
            />
            <button
              onClick={openAddDrawer}
              className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl"
            >
              + Guruh qo'shish
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div className={`border rounded-2xl p-4 ${theme.card}`}>
            <p className={`text-sm ${theme.soft}`}>Jami guruhlar</p>
            <p className={`mt-2 text-4xl font-bold ${theme.text}`}>
              {activeGroupsCount}
            </p>
          </div>
          <div className={`border rounded-2xl p-4 ${theme.card}`}>
            <p className={`text-sm ${theme.soft}`}>O'qituvchilar</p>
            <p className={`mt-2 text-4xl font-bold ${theme.text}`}>
              {groupTeachersCount}
            </p>
          </div>
          <div className={`border rounded-2xl p-4 ${theme.card}`}>
            <p className={`text-sm ${theme.soft}`}>Talabalar</p>
            <p className={`mt-2 text-4xl font-bold ${theme.text}`}>
              {totalStudents}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border">
          <table className="min-w-6xl w-full text-sm">
            <thead className={darkMode ? "bg-slate-800" : "bg-slate-50"}>
              <tr>
                <th className={`text-left px-4 py-3 font-medium ${theme.soft}`}>
                  Status
                </th>
                <th className={`text-left px-4 py-3 font-medium ${theme.soft}`}>
                  Guruh
                </th>
                <th className={`text-left px-4 py-3 font-medium ${theme.soft}`}>
                  Kurs
                </th>
                <th className={`text-left px-4 py-3 font-medium ${theme.soft}`}>
                  Davomiyligi
                </th>
                <th className={`text-left px-4 py-3 font-medium ${theme.soft}`}>
                  Dars vaqti
                </th>
                <th className={`text-left px-4 py-3 font-medium ${theme.soft}`}>
                  Kim qo'shgan
                </th>
                <th className={`text-left px-4 py-3 font-medium ${theme.soft}`}>
                  Xona
                </th>
                <th className={`text-left px-4 py-3 font-medium ${theme.soft}`}>
                  O'qituvchi
                </th>
                <th className={`text-left px-4 py-3 font-medium ${theme.soft}`}>
                  Talabalar
                </th>
                <th
                  className={`text-right px-4 py-3 font-medium ${theme.soft}`}
                >
                  Amallar
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={10}
                    className={`px-4 py-6 text-center ${theme.soft}`}
                  >
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : filteredGroups.length ? (
                filteredGroups.map((group) => {
                  const course = coursesById[group.courseId];
                  const roomName = roomsById[group.roomId]?.name || "-";
                  const studentsInGroup = Number(
                    group.studentsCount ??
                      group.studentCount ??
                      group.students?.length ??
                      0,
                  );
                  const lessonDays = (group.weekDays || [])
                    .map((d) => dayLabel[d] || d)
                    .join(", ");

                  return (
                    <tr
                      key={group.id}
                      onClick={() =>
                        handleOpenGroupDetails(group, course, roomName)
                      }
                      className={`border-t ${theme.rowBorder} ${
                        darkMode
                          ? "hover:bg-slate-800/30 cursor-pointer"
                          : "hover:bg-slate-50 cursor-pointer"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer ${getStatusBadgeClass(
                            group.status,
                          )}`}
                        >
                          {getStatusLabel(group.status)}
                        </span>
                      </td>
                      <td className={`px-4 py-3 font-medium ${theme.text}`}>
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenGroupDetails(group, course, roomName)
                          }
                          className="hover:underline cursor-pointer text-left"
                        >
                          {group.name || "-"}
                        </button>
                      </td>
                      <td className={`px-4 py-3 ${theme.text}`}>
                        {course?.name || "-"}
                      </td>
                      <td className={`px-4 py-3 ${theme.text}`}>
                        {course?.durationLesson
                          ? `${course.durationLesson} minut`
                          : "-"}
                      </td>
                      <td className={`px-4 py-3 ${theme.text}`}>
                        <p>{group.startTime || "-"}</p>
                        <p className={`text-xs ${theme.soft}`}>
                          {lessonDays || "-"}
                        </p>
                      </td>
                      <td className={`px-4 py-3 ${theme.text}`}>
                        {group.user?.fullName || "-"}
                      </td>
                      <td className={`px-4 py-3 ${theme.text}`}>{roomName}</td>
                      <td className={`px-4 py-3 ${theme.text}`}>
                        {getTeacherName(group)}
                      </td>
                      <td className={`px-4 py-3 ${theme.text}`}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenGroupDetails(group, course, roomName);
                          }}
                          className="underline decoration-dotted underline-offset-2 cursor-pointer"
                          title="Talabalarni ko'rish"
                        >
                          {studentsInGroup}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className="flex items-center justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              handleOpenGroupDetails(group, course, roomName, {
                                initialMainTab: "akademik-davomat",
                              });
                            }}
                            className="px-3 h-8 rounded-lg border text-xs font-medium cursor-pointer"
                          >
                            Davomat
                          </button>

                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenActionMenuId((prev) =>
                                  prev === group.id ? null : group.id,
                                )
                              }
                              className={`w-8 h-8 rounded-lg border text-sm leading-none flex items-center justify-center cursor-pointer ${theme.text}`}
                            >
                              ...
                            </button>

                            {openActionMenuId === group.id && (
                              <div
                                className={`absolute right-0 top-9 z-20 min-w-36 rounded-xl border p-1 shadow-lg ${theme.subpanel}`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    openEditDrawer(group);
                                    setOpenActionMenuId(null);
                                  }}
                                  className={`w-full rounded-lg px-3 py-2 text-left text-xs ${theme.submenuText} hover:bg-slate-100/70 cursor-pointer`}
                                >
                                  Tahrirlash
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(group.id)}
                                  className="w-full rounded-lg px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 cursor-pointer"
                                >
                                  O‘chirish
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={10}
                    className={`px-4 py-8 text-center ${theme.soft}`}
                  >
                    {activeTab === "ARCHIVE"
                      ? "Arxivdagi guruhlar topilmadi"
                      : activeTab === "FREEZE"
                        ? "Muzlatilgan guruhlar topilmadi"
                        : "Asosiy guruhlar topilmadi"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showDrawer && (
        <div className={`fixed inset-0 z-50 ${theme.overlay}`}>
          <div className="absolute inset-0" onClick={closeDrawer} />
          <div
            className={`absolute inset-y-0 right-0 w-full sm:max-w-108 overflow-y-auto p-6 ${
              darkMode ? "bg-slate-900" : "bg-white"
            }`}
          >
            <h3 className={`text-xl font-bold mb-4 ${theme.text}`}>
              {editingGroupId !== null ? "Guruhni tahrirlash" : "Yangi guruh"}
            </h3>

            <div className="space-y-4">
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Guruh nomi"
                className={`w-full rounded-xl border px-4 py-3 ${theme.input}`}
              />

              <div>
                <label className={`block text-sm mb-2 ${theme.soft}`}>
                  O'qituvchilar (bir nechta tanlash mumkin)
                </label>
                <select
                  multiple
                  value={selectedTeacherIds}
                  onChange={handleTeacherMultiChange}
                  className={`w-full rounded-xl border px-4 py-3 min-h-28 ${theme.input}`}
                >
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.fullName}
                    </option>
                  ))}
                </select>
                <p className={`mt-1 text-xs ${theme.soft}`}>
                  Kamida bitta o'qituvchi tanlanishi shart.
                </p>
              </div>

              <select
                name="courseId"
                value={formData.courseId}
                onChange={handleChange}
                className={`w-full rounded-xl border px-4 py-3 ${theme.input}`}
              >
                <option value="">Kurs tanlang</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>

              <select
                name="roomId"
                value={formData.roomId}
                onChange={handleChange}
                className={`w-full rounded-xl border px-4 py-3 ${theme.input}`}
              >
                <option value="">Xona tanlang</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>

              <div>
                <label className={`block text-sm mb-2 ${theme.soft}`}>
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={`w-full rounded-xl border px-4 py-3 ${theme.input}`}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="FREEZE">FREEZE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className={`w-full rounded-xl border px-4 py-3 ${theme.input}`}
              />
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className={`w-full rounded-xl border px-4 py-3 ${theme.input}`}
              />

              <div>
                <label className={`block text-sm mb-2 ${theme.soft}`}>
                  Talabalar (ixtiyoriy, bir nechta tanlash mumkin)
                </label>
                <div
                  className={`rounded-xl border p-3 max-h-56 overflow-y-auto ${theme.input}`}
                >
                  {students.length === 0 ? (
                    <p className={`text-sm ${theme.soft}`}>
                      Talabalar topilmadi
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {students.map((student) => {
                        const studentId = String(student.id);
                        const checked = selectedStudentIds.includes(studentId);

                        return (
                          <label
                            key={student.id}
                            className="flex items-center gap-3 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleStudentSelection(studentId)}
                              className="w-4 h-4 cursor-pointer"
                            />
                            <span className={`${theme.text}`}>
                              {student.fullName}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedStudentIds(
                        students.map((student) => String(student.id)),
                      )
                    }
                    className="px-2.5 py-1 text-xs rounded-lg border"
                  >
                    Barchasini tanlash
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStudentIds([])}
                    className="px-2.5 py-1 text-xs rounded-lg border"
                  >
                    Tozalash
                  </button>
                </div>
              </div>

              <div>
                <p className={`text-sm mb-2 ${theme.soft}`}>Dars kunlari</p>
                <div className="flex flex-wrap gap-2">
                  {WEEK_DAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleWeekDay(day)}
                      className={`px-3 py-1 rounded-full border text-sm ${
                        formData.weekDays.includes(day)
                          ? theme.tabActive
                          : theme.tab
                      }`}
                    >
                      {dayLabel[day]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={closeDrawer}
                className="px-4 py-2 border rounded-xl"
              >
                Bekor qilish
              </button>
              <button
                disabled={saving}
                onClick={handleSave}
                className="px-4 py-2 rounded-xl bg-violet-600 text-white disabled:opacity-60"
              >
                {saving ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
