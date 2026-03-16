import { useEffect, useMemo, useState } from "react";
import { usersApi } from "../api/crmApi";

const roles = [
  "SUPERADMIN",
  "ADMIN",
  "MANAGEMENT",
  "ADMINSTRATOR",
  "TEACHER",
  "STUDENT",
];

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

export default function EmployeesPage({ theme, darkMode }) {
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState("");

  const [employees, setEmployees] = useState([]);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    hireDate: "",
    password: "",
    role: "",
    position: "",
    address: "",
    photo: "",
  });

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const result = await usersApi.getAll();
      const list = Array.isArray(result?.data) ? result.data : [];

      setEmployees(
        list.map((user) => ({
          id: user.id,
          fullName: user.fullName,
          role: user.role,
          email: user.email,
          hireDate: user.hire_date
            ? new Date(user.hire_date).toISOString().slice(0, 10)
            : "",
          createdAt: user.created_at
            ? new Date(user.created_at).toISOString().slice(0, 10)
            : "",
          coin: 0,
          position: user.position || "-",
          address: user.address || "",
          photo: user.photo || "",
        })),
      );
    } catch {
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const query = search.trim().toLowerCase();

      const matchesSearch =
        !query ||
        employee.fullName.toLowerCase().includes(query) ||
        employee.email.toLowerCase().includes(query) ||
        employee.position.toLowerCase().includes(query) ||
        employee.role.toLowerCase().includes(query);

      return matchesSearch;
    });
  }, [employees, search]);

  const resetForm = () => {
    setEditingEmployeeId(null);
    setFormData({
      fullName: "",
      email: "",
      hireDate: "",
      password: "",
      role: "",
      position: "",
      address: "",
      photo: "",
    });
    setPhotoPreview("");
  };

  const openAddDrawer = () => {
    setEditingEmployeeId(null);
    setFormData({
      fullName: "",
      email: "",
      hireDate: "",
      password: "",
      role: "",
      position: "",
      address: "",
      photo: "",
    });
    setPhotoPreview("");
    setShowDrawer(true);
  };

  const openEditDrawer = (employee) => {
    setEditingEmployeeId(employee.id);
    setFormData({
      fullName: employee.fullName,
      email: employee.email,
      hireDate: employee.hireDate,
      password: "",
      role: employee.role,
      position: employee.position || "",
      address: employee.address || "",
      photo: "",
    });
    setPhotoPreview(employee.photo || "");
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

  const handleSave = async () => {
    if (
      !formData.fullName.trim() ||
      !formData.email.trim() ||
      !formData.position.trim()
    ) {
      alert("Majburiy maydonlarni to‘ldiring");
      return;
    }

    try {
      setSaving(true);

      if (editingEmployeeId !== null) {
        await usersApi.update(editingEmployeeId, {
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          position: formData.position.trim(),
          address: formData.address.trim() || undefined,
          ...(formData.photo instanceof File ? { photo: formData.photo } : {}),
        });
      } else {
        if (!formData.password.trim()) {
          alert("Yangi xodim uchun parol kiriting");
          return;
        }
        if (!formData.role.trim() || !formData.hireDate) {
          alert("Yangi xodim uchun role va ishga kirgan sanani kiriting");
          return;
        }

        await usersApi.create({
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          password: formData.password.trim(),
          role: formData.role,
          position: formData.position.trim(),
          hire_date: formData.hireDate,
          address: formData.address.trim() || undefined,
          ...(formData.photo instanceof File ? { photo: formData.photo } : {}),
        });
      }

      await loadEmployees();
      closeDrawer();
    } catch (error) {
      alert(error?.response?.data?.message || "Xodimni saqlashda xato");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await usersApi.remove(id);
      await loadEmployees();
    } catch (error) {
      alert(error?.response?.data?.message || "Xodimni o'chirishda xato");
    }
  };

  const roleBadgeClass = (role) => {
    const base = "inline-flex px-2.5 py-1 rounded-full text-[11px] font-medium";
    const map = {
      SUPERADMIN: darkMode
        ? "bg-red-500/10 text-red-300"
        : "bg-red-50 text-red-500",
      ADMIN: darkMode
        ? "bg-orange-500/10 text-orange-300"
        : "bg-orange-50 text-orange-500",
      MANAGEMENT: darkMode
        ? "bg-pink-500/10 text-pink-300"
        : "bg-pink-50 text-pink-500",
      ADMINSTRATOR: darkMode
        ? "bg-blue-500/10 text-blue-300"
        : "bg-blue-50 text-blue-500",
      TEACHER: darkMode
        ? "bg-violet-500/10 text-violet-300"
        : "bg-violet-50 text-violet-500",
      STUDENT: darkMode
        ? "bg-emerald-500/10 text-emerald-300"
        : "bg-emerald-50 text-emerald-500",
    };

    return `${base} ${
      map[role] ||
      (darkMode ? "bg-slate-700 text-slate-200" : "bg-slate-100 text-slate-600")
    }`;
  };

  return (
    <div className="space-y-6 w-full min-w-0 overflow-x-hidden">
      <div
        className={`${theme.card} border rounded-2xl p-3 sm:p-4 lg:p-5 shadow-sm overflow-hidden w-full min-w-0`}
      >
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-5 min-w-0">
          <div className="min-w-0">
            <h2
              className={`text-xl sm:text-2xl font-bold break-words ${theme.text}`}
            >
              Xodimlar
            </h2>
            <p className={`text-sm mt-1 break-words ${theme.soft}`}>
              Jami {filteredEmployees.length} ta xodim
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
            <input
              type="text"
              placeholder="Qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full sm:w-[220px] rounded-xl border pl-4 pr-4 py-3 outline-none min-w-0 ${theme.input}`}
            />

            <button
              onClick={openAddDrawer}
              className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-3 rounded-xl font-medium shrink-0"
            >
              + Xodim qo‘shish
            </button>
          </div>
        </div>

        <div className="hidden lg:block mt-5 rounded-2xl border overflow-hidden">
          <table className="w-full text-sm table-fixed">
            <thead className={darkMode ? "bg-slate-900/60" : "bg-slate-50"}>
              <tr className={theme.soft}>
                <th className="text-left font-medium px-3 py-4 w-[210px]">
                  Nomi
                </th>
                <th className="text-left font-medium px-3 py-4 w-[130px]">
                  Lavozimi
                </th>
                <th className="text-left font-medium px-3 py-4 w-[130px]">
                  Rol
                </th>
                <th className="text-left font-medium px-3 py-4 w-[160px]">
                  Email
                </th>
                <th className="text-left font-medium px-3 py-4 w-[120px]">
                  Ishga kirgan sana
                </th>
                <th className="text-left font-medium px-3 py-4 w-[120px]">
                  Yaratilgan sana
                </th>
                <th className="text-left font-medium px-3 py-4 w-[140px]">
                  Manzil
                </th>
                <th className="text-right font-medium px-3 py-4 w-[140px]">
                  Amallar
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className={`text-center py-10 ${theme.soft}`}>
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee, index) => (
                  <tr
                    key={employee.id}
                    className={`border-t ${
                      darkMode
                        ? "border-slate-800 hover:bg-slate-900/40"
                        : "border-slate-100 hover:bg-slate-50/80"
                    } transition`}
                  >
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {employee.photo ? (
                          <img
                            src={employee.photo}
                            alt={employee.fullName}
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
                            {getInitials(employee.fullName) || index + 1}
                          </div>
                        )}

                        <div className="min-w-0">
                          <p
                            className={`font-semibold truncate ${theme.text}`}
                            title={employee.fullName}
                          >
                            {employee.fullName}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-4">
                      <span className={roleBadgeClass(employee.role)}>
                        {employee.role}
                      </span>
                    </td>

                    <td
                      className={`px-3 py-4 truncate ${theme.text}`}
                      title={employee.role}
                    >
                      {employee.role}
                    </td>

                    <td className="px-3 py-4">
                      <p
                        className={`truncate ${theme.text}`}
                        title={employee.email}
                      >
                        {employee.email}
                      </p>
                    </td>

                    <td className={`px-3 py-4 ${theme.text}`}>
                      {formatDate(employee.hireDate)}
                    </td>

                    <td className={`px-3 py-4 ${theme.text}`}>
                      {formatDate(employee.createdAt)}
                    </td>

                    <td
                      className={`px-3 py-4 truncate ${theme.text}`}
                      title={employee.address || "-"}
                    >
                      {employee.address || "-"}
                    </td>

                    <td className="px-3 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                            darkMode
                              ? "border-slate-700 hover:bg-slate-800"
                              : "border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          👁️
                        </button>

                        <button
                          onClick={() => handleDelete(employee.id)}
                          className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                            darkMode
                              ? "border-slate-700 hover:bg-red-900/30"
                              : "border-slate-200 hover:bg-red-50"
                          }`}
                        >
                          🗑️
                        </button>

                        <button
                          onClick={() => openEditDrawer(employee)}
                          className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                            darkMode
                              ? "border-slate-700 hover:bg-slate-800"
                              : "border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          ✏️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className={`text-center py-10 ${theme.soft}`}>
                    Xodim topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden mt-5">
          {loading ? (
            <div
              className={`col-span-full text-center py-10 rounded-2xl border ${
                darkMode ? "border-slate-800" : "border-slate-200"
              } ${theme.soft}`}
            >
              Yuklanmoqda...
            </div>
          ) : filteredEmployees.length > 0 ? (
            filteredEmployees.map((employee, index) => (
              <div
                key={employee.id}
                className={`${theme.card} border rounded-2xl p-4 shadow-sm min-w-0`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {employee.photo ? (
                      <img
                        src={employee.photo}
                        alt={employee.fullName}
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
                        {getInitials(employee.fullName) || index + 1}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className={`font-semibold break-words ${theme.text}`}>
                        {employee.fullName}
                      </p>
                      <div className="mt-2">
                        <span className={roleBadgeClass(employee.role)}>
                          {employee.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                        darkMode
                          ? "border-slate-700 hover:bg-slate-800"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      👁️
                    </button>

                    <button
                      onClick={() => handleDelete(employee.id)}
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                        darkMode
                          ? "border-slate-700 hover:bg-red-900/30"
                          : "border-slate-200 hover:bg-red-50"
                      }`}
                    >
                      🗑️
                    </button>

                    <button
                      onClick={() => openEditDrawer(employee)}
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                        darkMode
                          ? "border-slate-700 hover:bg-slate-800"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      ✏️
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className={`break-words ${theme.text}`}>
                    <span className="font-medium">Rol:</span> {employee.role}
                  </div>

                  <div className={`break-words ${theme.text}`}>
                    <span className="font-medium">Email:</span> {employee.email}
                  </div>

                  <div className={theme.text}>
                    <span className="font-medium">Ishga kirgan sana:</span>{" "}
                    {formatDate(employee.hireDate)}
                  </div>

                  <div className={theme.text}>
                    <span className="font-medium">Yaratilgan sana:</span>{" "}
                    {formatDate(employee.createdAt)}
                  </div>

                  <div className={`break-words ${theme.text}`}>
                    <span className="font-medium">Manzil:</span>{" "}
                    {employee.address || "-"}
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
              Xodim topilmadi
            </div>
          )}
        </div>
      </div>

      {showDrawer && (
        <div className={`fixed inset-0 z-50 ${theme.overlay}`}>
          <div className="absolute inset-0" onClick={closeDrawer} />

          <div
            className={`absolute inset-y-0 right-0 w-full sm:max-w-[430px] shadow-2xl overflow-y-auto z-10 ${
              darkMode ? "bg-slate-900" : "bg-white"
            }`}
          >
            <div
              className={`p-4 sm:p-6 flex items-start justify-between gap-3 border-b ${
                darkMode ? "border-slate-800" : "border-slate-200"
              }`}
            >
              <h2 className={`text-lg sm:text-xl font-bold ${theme.text}`}>
                {editingEmployeeId !== null
                  ? "Xodimni tahrirlash"
                  : "Yangi Xodim qo‘shish"}
              </h2>

              <button
                onClick={closeDrawer}
                className={`text-xl shrink-0 ${theme.soft}`}
              >
                ×
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-5">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${theme.text}`}
                >
                  FIO
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Ism"
                  className={`w-full rounded-xl border px-4 py-3 outline-none min-w-0 ${theme.input}`}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${theme.text}`}
                >
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@gmail.com"
                  className={`w-full rounded-xl border px-4 py-3 outline-none min-w-0 ${theme.input}`}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${theme.text}`}
                >
                  Ishga kirgan sana
                </label>
                <input
                  type="date"
                  name="hireDate"
                  value={formData.hireDate}
                  onChange={handleChange}
                  disabled={editingEmployeeId !== null}
                  className={`w-full rounded-xl border px-4 py-3 outline-none min-w-0 ${theme.input}`}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${theme.text}`}
                >
                  Parol
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Parol"
                  className={`w-full rounded-xl border px-4 py-3 outline-none min-w-0 ${theme.input}`}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${theme.text}`}
                >
                  Rol
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  disabled={editingEmployeeId !== null}
                  className={`w-full rounded-xl border px-4 py-3 outline-none min-w-0 ${theme.input}`}
                >
                  <option value="">Tanlang</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${theme.text}`}
                >
                  Lavozim (position)
                </label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  placeholder="Masalan: Manager"
                  className={`w-full rounded-xl border px-4 py-3 outline-none min-w-0 ${theme.input}`}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${theme.text}`}
                >
                  Manzil (ixtiyoriy)
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Manzil"
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
                  <p className={`text-xs mt-1 ${theme.soft}`}>PNG, JPG, JPEG</p>
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
