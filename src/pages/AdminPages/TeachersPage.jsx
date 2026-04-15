import { useEffect, useMemo, useRef, useState } from "react";
import { groupsApi, teachersApi } from "../../api/crmApi";
import { formatUzTime, toInputDate } from "../../utils/date";

const formatDate = (value) => {
  if (!value) return "-";
  const [year, month, day] = value.split("-");
  return `${day}.${month}.${year}`;
};

const getInitials = (name = "") => {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
};

export default function TeachersPage({ theme, darkMode, currentUser }) {
  const [activeTab, setActiveTab] = useState("active");
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState(null);
  const [search, setSearch] = useState("");

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    type: "success",
    message: "",
  });
  const toastTimerRef = useRef(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [activeTeacher, setActiveTeacher] = useState(null);
  const [teacherGroups, setTeacherGroups] = useState([]);
  const [teacherGroupsLoading, setTeacherGroupsLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    position: "",
    experience: "",
    photo: "",
  });

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const result = await teachersApi.getAll();
      const list = Array.isArray(result?.data) ? result.data : [];

      const mapped = list.map((teacher) => {
        const createdAtSource = teacher.created_at || teacher.createdAt;
        const createdAt = toInputDate(createdAtSource);
        const createdTime = formatUzTime(createdAtSource);

        return {
          id: teacher.id,
          fullName: teacher.fullName,
          position: teacher.position || "-",
          experience: Number.isFinite(Number(teacher.experience))
            ? Number(teacher.experience)
            : 0,
          email: teacher.email || "-",
          createdAt,
          createdTime,
          photo: teacher.photo || "",
          archived: teacher.status !== "ACTIVE",
        };
      });

      setTeachers(mapped);
    } catch (error) {
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = (type, message) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    setToast({ show: true, type, message });
    toastTimerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 2600);
  };

  const filteredTeachers = useMemo(() => {
    return teachers.filter((teacher) => {
      const matchesBranch = true;
      const matchesArchive =
        activeTab === "active" ? !teacher.archived : teacher.archived;

      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        teacher.fullName.toLowerCase().includes(query) ||
        teacher.email.toLowerCase().includes(query) ||
        teacher.position.toLowerCase().includes(query);

      return matchesBranch && matchesArchive && matchesSearch;
    });
  }, [teachers, activeTab, search]);

  const resetForm = () => {
    setEditingTeacherId(null);
    setShowPassword(false);
    setFormData({
      fullName: "",
      email: "",
      password: "",
      position: "",
      experience: "",
      photo: "",
    });
    setPhotoPreview("");
  };

  const openAddDrawer = () => {
    setEditingTeacherId(null);
    setShowPassword(false);
    setFormData({
      fullName: "",
      email: "",
      password: "",
      position: "",
      experience: "",
      photo: "",
    });
    setPhotoPreview("");
    setShowDrawer(true);
  };

  const openEditDrawer = (teacher) => {
    setEditingTeacherId(teacher.id);
    setShowPassword(false);
    setFormData({
      fullName: teacher.fullName,
      email: teacher.email,
      password: "",
      position: teacher.position,
      experience: String(teacher.experience ?? ""),
      photo: "",
    });
    setPhotoPreview(teacher.photo || "");
    setShowDrawer(true);
  };

  const closeDrawer = () => {
    setShowDrawer(false);
    resetForm();
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "photo" && files?.[0]) {
      const file = files[0];
      setFormData((prev) => ({
        ...prev,
        photo: file,
      }));
      setPhotoPreview(URL.createObjectURL(file));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const preventExperienceAutoChange = (e) => {
    if (e.type === "wheel") {
      e.currentTarget.blur();
      return;
    }

    if (e.type === "keydown") {
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
      }
    }
  };

  const handleSave = async () => {
    const normalizedExperience = Number(formData.experience);

    if (
      !formData.email.trim() ||
      !formData.fullName.trim() ||
      !formData.position.trim() ||
      !Number.isFinite(normalizedExperience) ||
      normalizedExperience < 0 ||
      (editingTeacherId === null && !formData.password.trim())
    ) {
      alert("Majburiy maydonlarni to'ldiring");
      return;
    }

    try {
      setSaving(true);
      let createdEmailSent = true;
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        position: formData.position.trim(),
        experience: normalizedExperience,
        ...(formData.photo instanceof File ? { photo: formData.photo } : {}),
        ...(formData.password.trim()
          ? { password: formData.password.trim() }
          : {}),
      };

      if (editingTeacherId !== null) {
        await teachersApi.update(editingTeacherId, payload);
      } else {
        const createdResult = await teachersApi.create(payload);
        createdEmailSent = createdResult?.emailSent !== false;
      }

      await loadTeachers();
      closeDrawer();
      if (editingTeacherId === null) {
        showToast(
          createdEmailSent ? "success" : "warning",
          createdEmailSent
            ? "O'qituvchi yaratildi va login ma'lumotlari emailga yuborildi"
            : "O'qituvchi yaratildi, lekin email yuborilmadi",
        );
      }
    } catch (error) {
      alert(error?.response?.data?.message || "O'qituvchini saqlashda xato");
    } finally {
      setSaving(false);
    }
  };

  const toggleArchive = async (teacher) => {
    const isArchived = Boolean(teacher?.archived);
    const confirmed = window.confirm(
      isArchived
        ? "O'qituvchini arxivdan chiqarmoqchimisiz?"
        : "O'qituvchini arxivga yubormoqchimisiz?",
    );

    if (!confirmed) return;

    try {
      await teachersApi.toggleArchive(teacher.id);
      await loadTeachers();
      showToast(
        "success",
        isArchived
          ? "O'qituvchi arxivdan chiqarildi"
          : "O'qituvchi arxivga yuborildi",
      );
    } catch (error) {
      alert(
        error?.response?.data?.message || "Arxiv holatini o'zgartirishda xato",
      );
    }
  };

  const deleteArchivedTeacher = async (teacher) => {
    const confirmed = window.confirm(
      `${teacher.fullName} ni butunlay o'chirmoqchimisiz?`,
    );

    if (!confirmed) return;

    try {
      await teachersApi.remove(teacher.id);
      await loadTeachers();
      showToast("success", "Arxivdagi o'qituvchi o'chirildi");
    } catch (error) {
      alert(error?.response?.data?.message || "O'qituvchini o'chirishda xato");
    }
  };

  const openTeacherGroups = async (teacher) => {
    setActiveTeacher(teacher);
    setTeacherGroupsLoading(true);

    try {
      const groupsRes = await groupsApi.getAll();
      const groupsList = Array.isArray(groupsRes?.data) ? groupsRes.data : [];
      const relatedGroups = groupsList.filter(
        (group) => Number(group.teacherId) === Number(teacher.id),
      );

      const studentsResults = await Promise.allSettled(
        relatedGroups.map((group) => groupsApi.getStudentsByGroup(group.id)),
      );

      const mappedGroups = relatedGroups.map((group, index) => {
        const studentsResult = studentsResults[index];
        const students =
          studentsResult?.status === "fulfilled" &&
          Array.isArray(studentsResult.value?.data)
            ? [...studentsResult.value.data].sort((a, b) =>
                String(a?.fullName || "").localeCompare(
                  String(b?.fullName || ""),
                ),
              )
            : [];

        return {
          ...group,
          students,
        };
      });

      setTeacherGroups(mappedGroups);
    } catch {
      setTeacherGroups([]);
    } finally {
      setTeacherGroupsLoading(false);
    }
  };

  return (
    <div className="space-y-6 w-full min-w-0">
      <div
        className={`fixed top-4 right-4 z-50 transform transition-all duration-500 ${
          toast.show
            ? "translate-x-0 opacity-100"
            : "translate-x-8 opacity-0 pointer-events-none"
        }`}
      >
        <div
          className={`rounded-2xl px-5 py-3 shadow-xl text-white min-w-72 text-center ${
            toast.type === "error"
              ? "bg-red-500"
              : toast.type === "warning"
                ? "bg-amber-500"
                : "bg-emerald-500"
          }`}
        >
          {toast.message}
        </div>
      </div>

      <div
        className={`${theme.card} border rounded-2xl p-3 sm:p-4 lg:p-5 shadow-sm overflow-hidden w-full min-w-0`}
      >
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-5 min-w-0">
          <h2 className={`text-xl sm:text-2xl font-bold ${theme.text} min-w-0`}>
            O‘qituvchilar
          </h2>

          <div className="flex flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 w-full xl:w-auto">
            <button
              onClick={openAddDrawer}
              className="bg-violet-600 hover:bg-violet-700 text-white px-4 sm:px-5 py-3 rounded-xl font-medium"
            >
              + O‘qituvchi qo‘shish
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab("active")}
              className={`px-4 py-2 rounded-xl text-sm font-medium border ${
                activeTab === "active" ? theme.tabActive : theme.tab
              }`}
            >
              Faol o‘qituvchilar
            </button>

            <button
              onClick={() => setActiveTab("archive")}
              className={`px-4 py-2 rounded-xl text-sm font-medium border ${
                activeTab === "archive" ? theme.tabActive : theme.tab
              }`}
            >
              Arxiv
            </button>
          </div>

          <input
            type="text"
            placeholder="Qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full lg:w-[260px] rounded-xl border px-4 py-3 outline-none min-w-0 ${theme.input}`}
          />
        </div>

        <div className="mt-5 hidden lg:block w-full min-w-0">
          <div className="rounded-2xl border overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm table-fixed">
                <thead className={darkMode ? "bg-slate-900/60" : "bg-slate-50"}>
                  <tr className={theme.soft}>
                    <th className="text-left font-medium px-3 py-4 w-[50px]">
                      #
                    </th>
                    <th className="text-left font-medium px-3 py-4 w-[200px]">
                      Nomi
                    </th>
                    <th className="text-left font-medium px-3 py-4 w-[150px]">
                      Lavozim
                    </th>
                    <th className="text-left font-medium px-3 py-4 w-[130px]">
                      Tajriba
                    </th>
                    <th className="text-left font-medium px-3 py-4 w-[120px]">
                      Email
                    </th>
                    <th className="text-left font-medium px-3 py-4 w-[130px]">
                      Yaratilgan sana
                    </th>
                    <th className="text-right font-medium px-3 py-4 w-[130px]">
                      Amallar
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className={`text-center py-10 ${theme.soft}`}
                      >
                        Yuklanmoqda...
                      </td>
                    </tr>
                  ) : filteredTeachers.length > 0 ? (
                    filteredTeachers.map((teacher, index) => (
                      <tr
                        key={teacher.id}
                        className={`border-t transition ${
                          darkMode
                            ? "border-slate-800 hover:bg-slate-900/40"
                            : "border-slate-100 hover:bg-slate-50/70"
                        }`}
                      >
                        <td className={`px-3 py-4 ${theme.text}`}>
                          {index + 1}
                        </td>

                        <td className="px-3 py-4">
                          <div className="flex items-center gap-3 min-w-0">
                            {teacher.photo ? (
                              <img
                                src={teacher.photo}
                                alt={teacher.fullName}
                                className="w-10 h-10 rounded-full object-cover border shrink-0"
                              />
                            ) : (
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                  darkMode
                                    ? "bg-slate-800 text-slate-200"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {getInitials(teacher.fullName)}
                              </div>
                            )}

                            <p
                              className={`font-medium truncate min-w-0 ${theme.text}`}
                              title={teacher.fullName}
                            >
                              {teacher.fullName}
                            </p>
                          </div>
                        </td>

                        <td className={`px-3 py-4 ${theme.text}`}>
                          <div className="truncate" title={teacher.position}>
                            {teacher.position}
                          </div>
                        </td>

                        <td className={`px-3 py-4 ${theme.text} truncate`}>
                          {teacher.experience} yil
                        </td>

                        <td className={`px-3 py-4 ${theme.text} truncate`}>
                          {teacher.email}
                        </td>

                        <td className={`px-3 py-4 ${theme.text}`}>
                          <div>{formatDate(teacher.createdAt)}</div>
                          <div className={`text-xs mt-1 ${theme.soft}`}>
                            {teacher.createdTime}
                          </div>
                        </td>

                        <td className="px-3 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => toggleArchive(teacher)}
                              className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                                darkMode
                                  ? "border-slate-700 hover:bg-slate-800"
                                  : "border-slate-200 hover:bg-slate-50"
                              }`}
                              title={
                                teacher.archived
                                  ? "Arxivdan chiqarish"
                                  : "Arxivga yuborish"
                              }
                            >
                              {teacher.archived ? "♻️" : "📦"}
                            </button>

                            {teacher.archived && (
                              <button
                                onClick={() => deleteArchivedTeacher(teacher)}
                                className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                                  darkMode
                                    ? "border-red-700/60 hover:bg-red-900/30"
                                    : "border-red-200 hover:bg-red-50"
                                }`}
                                title="Arxivdan o'chirish"
                              >
                                🗑️
                              </button>
                            )}

                            <button
                              onClick={() => openTeacherGroups(teacher)}
                              className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                                darkMode
                                  ? "border-slate-700 hover:bg-slate-800"
                                  : "border-slate-200 hover:bg-slate-50"
                              }`}
                              title="Guruhlari"
                            >
                              👥
                            </button>

                            <button
                              onClick={() => openEditDrawer(teacher)}
                              className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                                darkMode
                                  ? "border-slate-700 hover:bg-slate-800"
                                  : "border-slate-200 hover:bg-slate-50"
                              }`}
                              title="Tahrirlash"
                            >
                              ✏️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className={`text-center py-10 ${theme.soft}`}
                      >
                        Ma’lumot topilmadi
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
          {filteredTeachers.length > 0 ? (
            filteredTeachers.map((teacher, index) => (
              <div
                key={teacher.id}
                className={`rounded-2xl border p-4 ${
                  darkMode
                    ? "border-slate-800 bg-slate-900/40"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-start gap-3">
                  {teacher.photo ? (
                    <img
                      src={teacher.photo}
                      alt={teacher.fullName}
                      className="w-12 h-12 rounded-full object-cover border shrink-0"
                    />
                  ) : (
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        darkMode
                          ? "bg-slate-800 text-slate-200"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {getInitials(teacher.fullName)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`font-semibold truncate ${theme.text}`}>
                        {index + 1}. {teacher.fullName}
                      </h3>
                    </div>
                    <p className={`text-sm mt-1 truncate ${theme.soft}`}>
                      {teacher.position}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm min-w-0">
                  <div className={`break-words ${theme.text}`}>
                    <span className="font-medium">Lavozim:</span>{" "}
                    {teacher.position}
                  </div>
                  <div className={`break-words ${theme.text}`}>
                    <span className="font-medium">Email:</span> {teacher.email}
                  </div>
                  <div className={`break-words ${theme.text}`}>
                    <span className="font-medium">Tajriba:</span>{" "}
                    {teacher.experience} yil
                  </div>
                  <div className={theme.text}>
                    <span className="font-medium">Yaratilgan sana:</span>{" "}
                    {formatDate(teacher.createdAt)} {teacher.createdTime}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleArchive(teacher)}
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                        darkMode
                          ? "border-slate-700 hover:bg-slate-800"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                      title={
                        teacher.archived
                          ? "Arxivdan chiqarish"
                          : "Arxivga yuborish"
                      }
                    >
                      {teacher.archived ? "♻️" : "📦"}
                    </button>

                    {teacher.archived && (
                      <button
                        onClick={() => deleteArchivedTeacher(teacher)}
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                          darkMode
                            ? "border-red-700/60 hover:bg-red-900/30"
                            : "border-red-200 hover:bg-red-50"
                        }`}
                        title="Arxivdan o'chirish"
                      >
                        🗑️
                      </button>
                    )}

                    <button
                      onClick={() => openTeacherGroups(teacher)}
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                        darkMode
                          ? "border-slate-700 hover:bg-slate-800"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                      title="Guruhlari"
                    >
                      👥
                    </button>

                    <button
                      onClick={() => openEditDrawer(teacher)}
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                        darkMode
                          ? "border-slate-700 hover:bg-slate-800"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                      title="Tahrirlash"
                    >
                      ✏️
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div
              className={`col-span-full text-center py-10 rounded-2xl border ${
                darkMode ? "border-slate-800" : "border-slate-200"
              } ${theme.soft}`}
            >
              Ma’lumot topilmadi
            </div>
          )}
        </div>

        {activeTeacher && (
          <div
            className={`mt-6 rounded-2xl border p-4 ${
              darkMode
                ? "border-slate-800 bg-slate-900/40"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className={`text-lg font-semibold ${theme.text}`}>
                {`${activeTeacher.fullName} guruhlari`}
              </h3>
              <button
                onClick={() => {
                  setActiveTeacher(null);
                  setTeacherGroups([]);
                }}
                className={`text-sm ${theme.soft}`}
              >
                Yopish
              </button>
            </div>

            {teacherGroupsLoading ? (
              <div className={`${theme.soft}`}>Yuklanmoqda...</div>
            ) : teacherGroups.length === 0 ? (
              <div className={`${theme.soft}`}>
                {currentUser?.role === "TEACHER"
                  ? "Bu o'qituvchida guruh yo'q"
                  : "Guruhlar topilmadi"}
              </div>
            ) : (
              <div className="space-y-3">
                {teacherGroups.map((group) => (
                  <div
                    key={group.id}
                    className={`rounded-xl border p-3 ${darkMode ? "border-slate-700" : "border-slate-200"}`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <h4 className={`font-semibold ${theme.text}`}>
                        {group.name}
                      </h4>
                      <span className={`text-sm ${theme.soft}`}>
                        Talabalar: {group.students.length}
                      </span>
                    </div>

                    {group.students.length === 0 ? (
                      <p className={`text-sm ${theme.soft}`}>
                        Talabalar topilmadi
                      </p>
                    ) : (
                      <ol className="space-y-1 text-sm list-decimal list-inside">
                        {group.students.map((student) => (
                          <li key={student.id} className={theme.text}>
                            {student.fullName || "-"}
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showDrawer && (
        <div className={`fixed inset-0 z-50 ${theme.overlay}`}>
          <div className="absolute inset-0" onClick={closeDrawer} />

          <div
            className={`absolute inset-y-0 right-0 w-full sm:max-w-[420px] shadow-2xl overflow-y-auto z-10 ${
              darkMode ? "bg-slate-900" : "bg-white"
            }`}
          >
            <div
              className={`p-4 sm:p-6 flex items-start justify-between gap-3 border-b ${
                darkMode ? "border-slate-800" : "border-slate-200"
              }`}
            >
              <div className="min-w-0">
                <h2 className={`text-lg sm:text-xl font-bold ${theme.text}`}>
                  {editingTeacherId !== null
                    ? "O‘qituvchini tahrirlash"
                    : "O‘qituvchi qo‘shish"}
                </h2>
                <p className={`text-sm mt-1 ${theme.soft}`}>
                  Backenddagi teacher maydonlariga mos forma.
                </p>
              </div>

              <button onClick={closeDrawer} className={`text-xl ${theme.soft}`}>
                ×
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-5">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${theme.text}`}
                >
                  O‘qituvchi FIO
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  autoComplete="name"
                  placeholder="Ism Familiya Otasining ismi"
                  className={`w-full rounded-xl border px-4 py-3 outline-none min-w-0 ${theme.input}`}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${theme.text}`}
                >
                  Mail
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  placeholder="example@gmail.com"
                  className={`w-full rounded-xl border px-4 py-3 outline-none min-w-0 ${theme.input}`}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${theme.text}`}
                >
                  Parol
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={
                      editingTeacherId === null
                        ? "Parol kiriting"
                        : "Yangi parol (ixtiyoriy)"
                    }
                    className={`w-full rounded-xl border px-4 py-3 pr-12 outline-none min-w-0 ${theme.input}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className={`absolute inset-y-0 right-0 px-3 flex items-center ${theme.soft}`}
                    aria-label={
                      showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"
                    }
                    title={
                      showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"
                    }
                  >
                    {showPassword ? (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M3 3L21 21"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M10.58 10.58C10.21 10.95 10 11.46 10 12C10 13.1 10.9 14 12 14C12.54 14 13.05 13.79 13.42 13.42"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M9.88 5.09C10.56 4.86 11.27 4.75 12 4.75C16.5 4.75 20.35 8.09 21.75 12C21.37 13.06 20.82 14.04 20.12 14.91"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M6.11 6.11C4.3 7.4 2.9 9.51 2.25 12C3.65 15.91 7.5 19.25 12 19.25C13.98 19.25 15.83 18.6 17.32 17.49"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M2.25 12C3.65 8.09 7.5 4.75 12 4.75C16.5 4.75 20.35 8.09 21.75 12C20.35 15.91 16.5 19.25 12 19.25C7.5 19.25 3.65 15.91 2.25 12Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="3"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${theme.text}`}
                >
                  Lavozim
                </label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  placeholder="teacher"
                  className={`w-full rounded-xl border px-4 py-3 outline-none min-w-0 ${theme.input}`}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${theme.text}`}
                >
                  Tajriba (yil)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  onWheel={preventExperienceAutoChange}
                  onKeyDown={preventExperienceAutoChange}
                  placeholder="Masalan: 4"
                  className={`w-full rounded-xl border px-4 py-3 outline-none min-w-0 ${theme.input}`}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${theme.text}`}
                >
                  Surati
                </label>

                <label
                  className={`flex flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-8 text-center cursor-pointer ${
                    darkMode
                      ? "border-slate-700 hover:bg-slate-800/70"
                      : "border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="file"
                    name="photo"
                    accept="image/*"
                    onChange={handleChange}
                    className="hidden"
                  />

                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-20 h-20 rounded-full object-cover mb-3"
                    />
                  ) : (
                    <div className={`text-3xl mb-3 ${theme.soft}`}>⬆️</div>
                  )}

                  <p className={`text-sm font-medium ${theme.text}`}>
                    Click to upload yoki yuklang
                  </p>
                  <p className={`text-xs mt-1 ${theme.soft}`}>JPG yoki PNG</p>
                </label>
              </div>
            </div>

            <div
              className={`p-4 sm:p-6 flex flex-col sm:flex-row justify-end gap-3 border-t ${
                darkMode ? "border-slate-800" : "border-slate-200"
              }`}
            >
              <button
                onClick={closeDrawer}
                className={`px-5 py-3 rounded-xl border ${
                  darkMode
                    ? "border-slate-700 text-slate-300"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                Bekor qilish
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium"
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
