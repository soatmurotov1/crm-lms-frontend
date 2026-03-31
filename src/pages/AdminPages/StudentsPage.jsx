import { useEffect, useState } from "react";
import { groupsApi, studentsApi } from "../../api/crmApi";
import { toInputDate } from "../../utils/date";

export default function StudentsPage({
  theme = {
    card: "bg-white",
    text: "text-slate-900",
    soft: "text-slate-500",
    rowBorder: "border-slate-200",
    input: "bg-white border-slate-200 text-slate-900",
  },
  darkMode = false,
  onOpenGroupDetails,
}) {
  const [openModal, setOpenModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [groupsModalStudent, setGroupsModalStudent] = useState(null);
  const [studentGroups, setStudentGroups] = useState([]);
  const [studentGroupsLoading, setStudentGroupsLoading] = useState(false);
  const [studentGroupsMap, setStudentGroupsMap] = useState({});
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    birth_date: "",
    status: "ACTIVE",
    photo: null,
  });

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await studentsApi.getAll();
      const list = Array.isArray(result?.data) ? result.data : [];
      const sortedStudents = [...list].sort(
        (a, b) => Number(a.id) - Number(b.id),
      );
      setStudents(sortedStudents);

      try {
        const groupsRes = await groupsApi.getAll();
        const groupsList = Array.isArray(groupsRes?.data) ? groupsRes.data : [];

        const studentResults = await Promise.allSettled(
          groupsList.map((group) => groupsApi.getStudentsByGroup(group.id)),
        );

        const nextMap = {};
        groupsList.forEach((group, index) => {
          const resultItem = studentResults[index];
          if (resultItem?.status !== "fulfilled") return;

          const members = Array.isArray(resultItem.value?.data)
            ? resultItem.value.data
            : [];

          members.forEach((member) => {
            const studentId = Number(member?.id);
            if (!Number.isFinite(studentId)) return;
            if (!nextMap[studentId]) nextMap[studentId] = [];
            nextMap[studentId].push(group.name);
          });
        });

        Object.keys(nextMap).forEach((studentId) => {
          nextMap[studentId] = [...new Set(nextMap[studentId])].sort((a, b) =>
            String(a).localeCompare(String(b)),
          );
        });

        setStudentGroupsMap(nextMap);
      } catch {
        setStudentGroupsMap({});
      }
    } catch (apiError) {
      setError(
        apiError?.response?.data?.message || "Studentlarni olishda xato",
      );
      setStudents([]);
      setStudentGroupsMap({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, photo: file }));
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setFormData({
      fullName: student.fullName || "",
      email: student.email || "",
      password: "",
      birth_date: toInputDate(student.birth_date),
      status: student.status || "ACTIVE",
      photo: null,
    });
    setOpenModal(true);
  };

  const handleSaveStudent = async () => {
    if (
      !formData.fullName.trim() ||
      !formData.email.trim() ||
      !formData.birth_date ||
      (!editingStudent && !formData.password.trim())
    ) {
      alert("Majburiy maydonlarni to'ldiring");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        birth_date: formData.birth_date,
        status: formData.status,
        ...(formData.password.trim() ? { password: formData.password } : {}),
        ...(formData.photo ? { photo: formData.photo } : {}),
      };

      if (editingStudent) {
        await studentsApi.update(editingStudent.id, payload);
      } else {
        await studentsApi.create(payload);
      }

      setOpenModal(false);
      setEditingStudent(null);
      setFormData({
        fullName: "",
        email: "",
        password: "",
        birth_date: "",
        status: "ACTIVE",
        photo: null,
      });
      await loadStudents();
    } catch (apiError) {
      alert(apiError?.response?.data?.message || "Talabani saqlashda xato");
    } finally {
      setSaving(false);
    }
  };

  const toggleStudentStatus = async (student) => {
    const nextStatus = student.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await studentsApi.update(student.id, { status: nextStatus });
      await loadStudents();
    } catch (apiError) {
      alert(
        apiError?.response?.data?.message || "Statusni o'zgartirishda xato",
      );
    }
  };

  const openStudentGroups = async (student) => {
    setGroupsModalStudent(student);
    setStudentGroupsLoading(true);
    setStudentGroups([]);
    try {
      const groupsRes = await groupsApi.getAll();
      const groupsList = Array.isArray(groupsRes?.data) ? groupsRes.data : [];

      const studentResults = await Promise.allSettled(
        groupsList.map((group) => groupsApi.getStudentsByGroup(group.id)),
      );

      const relatedGroups = groupsList.filter((group, index) => {
        const result = studentResults[index];
        if (result?.status !== "fulfilled") return false;
        const list = Array.isArray(result.value?.data) ? result.value.data : [];
        return list.some((item) => Number(item.id) === Number(student.id));
      });

      setStudentGroups(relatedGroups);
    } catch {
      setStudentGroups([]);
    } finally {
      setStudentGroupsLoading(false);
    }
  };

  const handleOpenGroupDetails = (group) => {
    if (!group?.id) return;

    onOpenGroupDetails?.({
      id: group.id,
      name: group.name,
      lessonTime: group.startTime,
      days: Array.isArray(group.weekDays) ? group.weekDays : [],
      room: group.room?.name || "-",
      course: group.course?.name || "-",
      teacher: group.teacher?.fullName || "-",
    });

    setGroupsModalStudent(null);
    setStudentGroups([]);
  };

  return (
    <div className="space-y-4 min-w-0">
      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <h2 className={`text-2xl font-bold ${theme.text}`}>O'quvchilar</h2>

        <button
          onClick={() => {
            setEditingStudent(null);
            setFormData({
              fullName: "",
              email: "",
              password: "",
              birth_date: "",
              status: "ACTIVE",
              photo: null,
            });
            setOpenModal(true);
          }}
          className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg"
        >
          + Talaba qo'shish
        </button>
      </div>

      {/* TABLE */}
      <div
        className={`${theme.card} border ${theme.rowBorder} rounded-xl shadow overflow-hidden`}
      >
        <table className="w-full">
          <thead className={darkMode ? "bg-slate-800" : "bg-slate-100"}>
            <tr className={`text-left ${theme.text}`}>
              <th className="p-4">#</th>
              <th className="p-4">Rasm</th>
              <th className="p-4">Ism</th>
              <th className="p-4">Guruh</th>
              <th className="p-4">Email</th>
              <th className="p-4">Amallar</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr className={`border-t ${theme.rowBorder}`}>
                <td className="p-4" colSpan={6}>
                  <span className={theme.soft}>Yuklanmoqda...</span>
                </td>
              </tr>
            ) : (
              students.map((s) => (
                <tr key={s.id} className={`border-t ${theme.rowBorder}`}>
                  <td className={`p-4 ${theme.text}`}>{s.id}</td>
                  <td className="p-4">
                    {s.photo ? (
                      <img
                        src={s.photo}
                        alt={s.fullName}
                        className="w-10 h-10 rounded-full object-cover border"
                      />
                    ) : (
                      <div
                        className={`w-10 h-10 rounded-full border flex items-center justify-center text-xs ${
                          darkMode
                            ? "bg-slate-800 text-slate-300 border-slate-700"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        Rasm yo'q
                      </div>
                    )}
                  </td>
                  <td className={`p-4 ${theme.text}`}>{s.fullName}</td>
                  <td className={`p-4 ${theme.text}`}>
                    {(studentGroupsMap[s.id] || []).length > 0
                      ? studentGroupsMap[s.id].join(", ")
                      : "-"}
                  </td>
                  <td className={`p-4 ${theme.text}`}>{s.email}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => openEditModal(s)}
                        className={`px-2 py-1 text-xs rounded-lg border ${
                          darkMode
                            ? "border-slate-600 hover:bg-slate-800 text-slate-200"
                            : "border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        Tahrirlash
                      </button>
                      <button
                        onClick={() => toggleStudentStatus(s)}
                        className={`px-2 py-1 text-xs rounded-lg border ${
                          s.status === "ACTIVE"
                            ? darkMode
                              ? "border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
                              : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            : darkMode
                              ? "border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
                              : "border-amber-200 text-amber-700 hover:bg-amber-50"
                        }`}
                      >
                        Status: {s.status || "ACTIVE"}
                      </button>
                      <button
                        onClick={() => openStudentGroups(s)}
                        className={`px-2 py-1 text-xs rounded-lg border ${
                          darkMode
                            ? "border-slate-600 hover:bg-slate-800 text-slate-200"
                            : "border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        Guruhlari
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}

            {!loading && !students.length && (
              <tr className={`border-t ${theme.rowBorder}`}>
                <td className="p-4" colSpan={6}>
                  <span className={theme.soft}>
                    {error || "Ma'lumot topilmadi"}
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {groupsModalStudent && (
        <div
          className={`fixed inset-0 z-40 flex items-center justify-center p-4 ${
            darkMode ? "bg-slate-900/70" : "bg-slate-900/40"
          }`}
        >
          <div
            className={`w-full max-w-lg rounded-xl border p-5 ${
              darkMode
                ? "bg-slate-900 border-slate-700"
                : "bg-white border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className={`text-lg font-semibold ${theme.text}`}>
                {groupsModalStudent.fullName} guruhlari
              </h3>
              <button
                onClick={() => {
                  setGroupsModalStudent(null);
                  setStudentGroups([]);
                }}
                className={`${theme.soft} cursor-pointer`}
              >
                Yopish
              </button>
            </div>

            {studentGroupsLoading ? (
              <p className={theme.soft}>Yuklanmoqda...</p>
            ) : studentGroups.length === 0 ? (
              <p className={theme.soft}>Bu talaba hech qaysi guruhda yo'q</p>
            ) : (
              <ul className="space-y-2">
                {studentGroups.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => handleOpenGroupDetails(group)}
                    className={`rounded-lg border px-3 py-2 w-full text-left cursor-pointer ${
                      darkMode
                        ? "border-slate-700 text-slate-200 hover:bg-slate-800"
                        : "border-slate-200 text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    {group.name}
                  </button>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* MODAL */}
      {openModal && (
        <div
          className={`fixed top-0 right-0 h-full w-100 shadow-2xl p-6 border-l ${
            darkMode
              ? "bg-slate-900 border-slate-700"
              : "bg-white border-slate-200"
          }`}
        >
          <h3 className={`text-xl font-bold mb-6 ${theme.text}`}>
            {editingStudent ? "Talabani tahrirlash" : "Talaba qo'shish"}
          </h3>

          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Talaba FIO"
            className={`border w-full p-3 rounded-lg mb-4 ${theme.input}`}
          />

          <input
            type="text"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Mail"
            className={`border w-full p-3 rounded-lg mb-4 ${theme.input}`}
          />

          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder={editingStudent ? "Yangi parol (ixtiyoriy)" : "Parol"}
            className={`border w-full p-3 rounded-lg mb-4 ${theme.input}`}
          />

          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className={`border w-full p-3 rounded-lg mb-4 ${theme.input}`}
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="FREEZE">FREEZE</option>
          </select>

          <input
            type="date"
            name="birth_date"
            value={formData.birth_date}
            onChange={handleChange}
            className={`border w-full p-3 rounded-lg mb-4 ${theme.input}`}
          />

          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className={`border w-full p-3 rounded-lg mb-4 ${theme.input}`}
          />

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setOpenModal(false)}
              className={`px-4 py-2 border rounded-lg ${theme.text}`}
            >
              Bekor qilish
            </button>

            <button
              disabled={saving}
              onClick={handleSaveStudent}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg disabled:opacity-60"
            >
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
