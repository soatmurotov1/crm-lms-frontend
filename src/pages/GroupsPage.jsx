import { useEffect, useMemo, useState } from "react";
import { coursesApi, groupsApi, roomsApi, teachersApi } from "../api/crmApi";

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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("GROUPS");
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState(null);

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

  const loadData = async () => {
    try {
      setLoading(true);
      const [groupsRes, coursesRes, roomsRes, teachersRes] =
        await Promise.allSettled([
          groupsApi.getAll(),
          coursesApi.getAll(),
          roomsApi.getAll(),
          teachersApi.getAll(),
        ]);

      const groupsList =
        groupsRes.status === "fulfilled" && Array.isArray(groupsRes.value?.data)
          ? groupsRes.value.data
          : [];
      const isTeacher = currentUser?.role === "TEACHER";

      setGroups(
        isTeacher
          ? groupsList.filter(
              (group) => Number(group.teacherId) === Number(currentUser?.id),
            )
          : groupsList,
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
    } catch (error) {
      setGroups([]);
      setCourses([]);
      setRooms([]);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser?.id, currentUser?.role]);

  const tabGroups = useMemo(() => {
    if (activeTab === "ARCHIVE") {
      return groups.filter(
        (group) => group.status && group.status !== "ACTIVE",
      );
    }

    return groups.filter((group) => !group.status || group.status === "ACTIVE");
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

  const activeGroupsCount = useMemo(
    () =>
      groups.filter((group) => !group.status || group.status === "ACTIVE")
        .length,
    [groups],
  );

  const groupTeachersCount = useMemo(
    () =>
      new Set(
        groups
          .map((group) => group.teacherId)
          .filter((teacherId) => teacherId !== undefined && teacherId !== null),
      ).size,
    [groups],
  );

  const totalStudents = useMemo(
    () =>
      groups.reduce(
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
    [groups],
  );

  const getTeacherName = (group) =>
    teachersById[group.teacherId]?.fullName ||
    (Number(group.teacherId) === Number(currentUser?.id)
      ? currentUser?.fullName || "-"
      : "O'qituvchi yo'q");

  const getStatusBadgeClass = (status) => {
    if (status === "FREEZE") {
      return darkMode
        ? "bg-amber-500/20 text-amber-300"
        : "bg-amber-100 text-amber-700";
    }
    if (status === "INACTIVE") {
      return darkMode
        ? "bg-rose-500/20 text-rose-300"
        : "bg-rose-100 text-rose-700";
    }
    return darkMode
      ? "bg-emerald-500/20 text-emerald-300"
      : "bg-emerald-100 text-emerald-700";
  };

  const getStatusLabel = (status) => {
    if (status === "FREEZE") return "FREEZE";
    if (status === "INACTIVE") return "INACTIVE";
    return "ACTIVE";
  };

  const resetForm = () => {
    setEditingGroupId(null);
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
    setFormData({
      name: group.name || "",
      courseId: String(group.courseId || ""),
      roomId: String(group.roomId || ""),
      teacherId: String(group.teacherId || ""),
      startDate: group.startDate
        ? new Date(group.startDate).toISOString().slice(0, 10)
        : "",
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
      !formData.teacherId ||
      !formData.startDate ||
      !formData.startTime ||
      !formData.weekDays.length
    ) {
      alert("Majburiy maydonlarni to'ldiring");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim(),
        courseId: Number(formData.courseId),
        roomId: Number(formData.roomId),
        teacherId: Number(formData.teacherId),
        startDate: formData.startDate,
        startTime: formData.startTime,
        weekDays: formData.weekDays,
        status: formData.status,
      };

      if (editingGroupId !== null) {
        await groupsApi.update(editingGroupId, payload);
      } else {
        await groupsApi.create(payload);
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
    try {
      await groupsApi.remove(id);
      await loadData();
    } catch (error) {
      alert(error?.response?.data?.message || "Guruhni o'chirishda xato");
    }
  };

  return (
    <div className="space-y-6 w-full min-w-0 overflow-x-hidden">
      <div className={`${theme.card} border rounded-2xl p-5 shadow-sm`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-5">
          <div>
            <h2 className={`text-3xl font-bold ${theme.text}`}>Guruhlar</h2>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => setActiveTab("GROUPS")}
                className={`px-3 py-1.5 text-sm rounded-lg border ${
                  activeTab === "GROUPS" ? theme.tabActive : theme.tab
                }`}
              >
                Guruhlar
              </button>
              <button
                onClick={() => setActiveTab("ARCHIVE")}
                className={`px-3 py-1.5 text-sm rounded-lg border ${
                  activeTab === "ARCHIVE" ? theme.tabActive : theme.tab
                }`}
              >
                Arxiv
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
                      className={`border-t ${theme.rowBorder}`}
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(
                            group.status,
                          )}`}
                        >
                          {getStatusLabel(group.status)}
                        </span>
                      </td>
                      <td className={`px-4 py-3 font-medium ${theme.text}`}>
                        {group.name || "-"}
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
                        {group.userId ? `ID: ${group.userId}` : "-"}
                      </td>
                      <td className={`px-4 py-3 ${theme.text}`}>{roomName}</td>
                      <td className={`px-4 py-3 ${theme.text}`}>
                        {getTeacherName(group)}
                      </td>
                      <td className={`px-4 py-3 ${theme.text}`}>
                        {studentsInGroup}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              onOpenGroupDetails?.({
                                id: group.id,
                                name: group.name,
                                course: course?.name || "-",
                                teacher: getTeacherName(group),
                                room: roomName,
                                lessonTime: group.startTime,
                                days: group.weekDays || [],
                                duration: course?.durationLesson
                                  ? `${course.durationLesson} minut`
                                  : "-",
                              })
                            }
                            className={`px-3 py-1.5 rounded-lg border text-xs ${theme.text}`}
                          >
                            Ko'rish
                          </button>
                          <button
                            onClick={() => openEditDrawer(group)}
                            className={`px-3 py-1.5 rounded-lg border text-xs ${theme.text}`}
                          >
                            Tahrirlash
                          </button>
                          <button
                            onClick={() => handleDelete(group.id)}
                            className="px-3 py-1.5 rounded-lg border text-xs text-red-500"
                          >
                            O'chirish
                          </button>
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
                      ? "Arxiv guruhlar topilmadi"
                      : "Guruhlar topilmadi"}
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

              <select
                name="teacherId"
                value={formData.teacherId}
                onChange={handleChange}
                className={`w-full rounded-xl border px-4 py-3 ${theme.input}`}
              >
                <option value="">O'qituvchi tanlang</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.fullName}
                  </option>
                ))}
              </select>

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
