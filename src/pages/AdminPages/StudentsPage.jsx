import { useEffect, useRef, useState } from "react";
import { groupsApi, paymentsApi, studentsApi } from "../../api/crmApi";
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
  const [paymentsModalStudent, setPaymentsModalStudent] = useState(null);
  const [studentPayments, setStudentPayments] = useState([]);
  const [studentPaymentsLoading, setStudentPaymentsLoading] = useState(false);
  const [paymentActionLoading, setPaymentActionLoading] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    type: "success",
    message: "",
  });
  const toastTimerRef = useRef(null);
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

  const formatAmount = (value) =>
    new Intl.NumberFormat("uz-UZ").format(Number(value || 0));

  const formatBirthDateLabel = (value) => {
    if (!value || typeof value !== "string") return "";
    const [year, month, day] = value.split("-");
    if (!year || !month || !day) return "";
    return `${day}.${month}.${year}`;
  };

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
    setShowPassword(false);
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
      let createdEmailSent = true;
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        birth_date: formData.birth_date,
        status: formData.status,
        ...(formData.password.trim()
          ? { password: formData.password.trim() }
          : {}),
        ...(formData.photo ? { photo: formData.photo } : {}),
      };

      if (editingStudent) {
        await studentsApi.update(editingStudent.id, payload);
      } else {
        const createdResult = await studentsApi.create(payload);
        createdEmailSent = createdResult?.emailSent !== false;
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
      if (!editingStudent) {
        showToast(
          createdEmailSent ? "success" : "warning",
          createdEmailSent
            ? "Talaba yaratildi va login ma'lumotlari emailga yuborildi"
            : "Talaba yaratildi, lekin email yuborilmadi",
        );
      }
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

  const openStudentPayments = async (student) => {
    setPaymentsModalStudent(student);
    setStudentPaymentsLoading(true);
    setStudentPayments([]);

    try {
      const now = new Date();
      const result = await paymentsApi.getStudentMonthly(student.id, {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      });
      const list = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : [];
      setStudentPayments(list);
    } catch {
      setStudentPayments([]);
    } finally {
      setStudentPaymentsLoading(false);
    }
  };

  const refreshStudentPayments = async () => {
    if (!paymentsModalStudent?.id) return;
    try {
      const now = new Date();
      const result = await paymentsApi.getStudentMonthly(
        paymentsModalStudent.id,
        { year: now.getFullYear(), month: now.getMonth() + 1 },
      );
      const list = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : [];
      setStudentPayments(list);
    } catch {
      setStudentPayments([]);
    }
  };

  const handleStartPayment = async (item) => {
    if (!paymentsModalStudent?.id) return;
    setPaymentActionLoading(`start-${item.groupId}`);
    try {
      const now = new Date();
      const result = await paymentsApi.startStudentPayment(
        paymentsModalStudent.id,
        {
          groupId: item.groupId,
          year: now.getFullYear(),
          month: now.getMonth() + 1,
        },
      );
      if (result?.paymentUrl) {
        window.open(result.paymentUrl, "_blank", "noopener,noreferrer");
      }
      await refreshStudentPayments();
    } catch (apiError) {
      alert(apiError?.response?.data?.message || "To'lovni boshlashda xato");
    } finally {
      setPaymentActionLoading(null);
    }
  };

  const handleMarkPaid = async (item) => {
    if (!item?.paymentId) return;
    setPaymentActionLoading(`paid-${item.paymentId}`);
    try {
      await paymentsApi.markPaid(item.paymentId, { method: "MANUAL" });
      await refreshStudentPayments();
    } catch (apiError) {
      alert(apiError?.response?.data?.message || "To'lovni tasdiqlashda xato");
    } finally {
      setPaymentActionLoading(null);
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

      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <h2 className={`text-2xl font-bold ${theme.text}`}>O'quvchilar</h2>

        <button
          onClick={() => {
            setEditingStudent(null);
            setShowPassword(false);
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
                      <button
                        onClick={() => openStudentPayments(s)}
                        className={`px-2 py-1 text-xs rounded-lg border ${
                          darkMode
                            ? "border-slate-600 hover:bg-slate-800 text-slate-200"
                            : "border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        To'lovlar
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

      {paymentsModalStudent && (
        <div
          className={`fixed inset-0 z-40 flex items-center justify-center p-4 ${
            darkMode ? "bg-slate-900/70" : "bg-slate-900/40"
          }`}
        >
          <div
            className={`w-full max-w-2xl rounded-xl border p-5 ${
              darkMode
                ? "bg-slate-900 border-slate-700"
                : "bg-white border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className={`text-lg font-semibold ${theme.text}`}>
                {paymentsModalStudent.fullName} to'lovlari
              </h3>
              <button
                onClick={() => {
                  setPaymentsModalStudent(null);
                  setStudentPayments([]);
                }}
                className={`${theme.soft} cursor-pointer`}
              >
                Yopish
              </button>
            </div>

            {studentPaymentsLoading ? (
              <p className={theme.soft}>Yuklanmoqda...</p>
            ) : studentPayments.length === 0 ? (
              <p className={theme.soft}>To'lovlar topilmadi</p>
            ) : (
              <div className="space-y-3">
                {studentPayments.map((item) => {
                  const statusLabel =
                    {
                      DEBT: "Qarz",
                      PENDING: "Kutilmoqda",
                      PAID: "Qabul qilingan",
                      CANCELED: "Bekor qilingan",
                    }[item.status] || item.status;
                  const statusClass =
                    {
                      DEBT: "bg-red-100 text-red-700",
                      PENDING: "bg-amber-100 text-amber-700",
                      PAID: "bg-emerald-100 text-emerald-700",
                      CANCELED: "bg-slate-200 text-slate-600",
                    }[item.status] || "bg-slate-100 text-slate-600";
                  const isStarting =
                    paymentActionLoading === `start-${item.groupId}`;
                  const isMarking =
                    paymentActionLoading === `paid-${item.paymentId}`;

                  return (
                    <div
                      key={item.groupId}
                      className={`rounded-xl border p-4 ${
                        darkMode
                          ? "border-slate-700 text-slate-200"
                          : "border-slate-200 text-slate-800"
                      }`}
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-semibold">
                            {item.groupName} · {item.courseName}
                          </p>
                          <p className={theme.soft}>
                            {formatAmount(item.amount)} so'm
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass}`}
                          >
                            {statusLabel}
                          </span>

                          {item.status !== "PAID" && (
                            <button
                              onClick={() => handleStartPayment(item)}
                              disabled={isStarting}
                              className="px-3 py-2 text-xs rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60"
                            >
                              {isStarting ? "Yuborilmoqda..." : "To'lov qilish"}
                            </button>
                          )}

                          {item.status === "PENDING" && item.paymentId && (
                            <button
                              onClick={() => handleMarkPaid(item)}
                              disabled={isMarking}
                              className={`px-3 py-2 text-xs rounded-lg border ${
                                darkMode
                                  ? "border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10"
                                  : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                              } disabled:opacity-60`}
                            >
                              {isMarking ? "Saqlanmoqda..." : "Tasdiqlash"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
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
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Mail"
            className={`border w-full p-3 rounded-lg mb-4 ${theme.input}`}
          />

          <input
            type="hidden"
            autoComplete="username"
            value={formData.email}
            readOnly
          />

          <div className="mb-4">
            <label className={`block text-sm font-medium mb-2 ${theme.text}`}>
              Parol
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                autoComplete={
                  editingStudent ? "new-password" : "current-password"
                }
                placeholder={
                  editingStudent ? "Yangi parol (ixtiyoriy)" : "Parol"
                }
                className={`border w-full p-3 pr-12 rounded-lg ${theme.input}`}
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

          <div className="mb-4">
            <label className={`block text-sm font-medium mb-2 ${theme.text}`}>
              Tug'ilgan sana
            </label>
            <input
              type="date"
              name="birth_date"
              value={formData.birth_date}
              onChange={handleChange}
              min="1900-01-01"
              max={toInputDate(new Date())}
              className={`border w-full p-3 rounded-lg ${theme.input}`}
            />
            {formData.birth_date && (
              <p className={`text-xs mt-1 ${theme.soft}`}>
                Tanlangan sana: {formatBirthDateLabel(formData.birth_date)}
              </p>
            )}
          </div>

          <div className="mb-4">
            <input
              id="student-photo-input"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
            <label
              htmlFor="student-photo-input"
              className={`border w-full p-3 rounded-lg flex items-center justify-between cursor-pointer ${theme.input}`}
            >
              <span>{formData.photo?.name || "Image"}</span>
              <span className={`${theme.soft}`}>Yuklash</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => {
                setOpenModal(false);
                setShowPassword(false);
              }}
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
