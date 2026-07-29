import { useEffect, useMemo, useState } from "react";
import Card from "../../components/ui/Card";
import PasswordInput from "../../components/ui/PasswordInput";
import SectionHeader from "../../components/ui/SectionHeader";
import StatCard from "../../components/ui/StatCard";
import { organizationsApi } from "../../api/crmApi";
import { formatUzDate } from "../../utils/date";
import { useTheme } from "../../theme/themeContext";

const STATUS_FILTERS = [
  { value: "ALL", label: "Barchasi" },
  { value: "ACTIVE", label: "Faol" },
  { value: "INACTIVE", label: "Nofaol" },
  { value: "FREEZE", label: "Muzlatilgan" },
];

const STATUS_LABELS = {
  ACTIVE: "Faol",
  INACTIVE: "Nofaol",
  FREEZE: "Muzlatilgan",
};

const STATUS_TONES = {
  ACTIVE: {
    dark: "bg-emerald-500/15 text-emerald-300",
    light: "bg-emerald-50 text-emerald-600",
  },
  INACTIVE: {
    dark: "bg-slate-500/15 text-slate-300",
    light: "bg-slate-100 text-slate-600",
  },
  FREEZE: {
    dark: "bg-amber-500/15 text-amber-300",
    light: "bg-amber-50 text-amber-600",
  },
};

const EMPTY_FORM = {
  name: "",
  phone: "",
  password: "",
  adminName: "",
  address: "",
  directorName: "",
  description: "",
  status: "ACTIVE",
};

const MIN_PASSWORD_LENGTH = 6;

const formatUzs = (value) =>
  `${new Intl.NumberFormat("uz-UZ").format(Number(value || 0))} so'm`;

export default function OrganizationsPage() {
  const { theme, darkMode } = useTheme();

  const [organizations, setOrganizations] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showDrawer, setShowDrawer] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const loadOrganizations = async (status = statusFilter) => {
    try {
      setLoading(true);
      setError("");
      const result = await organizationsApi.getAll(status);
      setOrganizations(Array.isArray(result?.data) ? result.data : []);
    } catch (err) {
      setOrganizations([]);
      setError(
        err?.response?.data?.message || "Tashkilotlarni yuklashda xatolik",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizations(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const stats = useMemo(() => {
    const active = organizations.filter(
      (item) => item.status === "ACTIVE",
    ).length;
    const withSubscription = organizations.filter(
      (item) => item.activeSubscription,
    ).length;

    return {
      total: organizations.length,
      active,
      withSubscription,
    };
  }, [organizations]);

  const openAddDrawer = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setShowDrawer(true);
  };

  const openEditDrawer = (organization) => {
    setEditingId(organization.id);
    setFormData({
      name: organization.name || "",
      phone: organization.phone || "",
      password: "",
      adminName: organization.admin?.fullName || "",
      address: organization.address || "",
      directorName: organization.directorName || "",
      description: organization.description || "",
      status: organization.status || "ACTIVE",
    });
    setShowDrawer(true);
  };

  const closeDrawer = () => {
    setShowDrawer(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const isEditing = editingId !== null;

    if (!formData.name.trim()) {
      alert("Tashkilot nomi kiritilishi kerak");
      return;
    }

    if (!formData.phone.trim()) {
      alert("Telefon raqami kiritilishi kerak — u admin uchun login bo'ladi");
      return;
    }

    // Yaratishda parol majburiy, tahrirlashda esa bo'sh qoldirilsa o'zgarmaydi.
    if (!isEditing && !formData.password.trim()) {
      alert("Parol kiritilishi kerak");
      return;
    }

    if (
      formData.password.trim() &&
      formData.password.trim().length < MIN_PASSWORD_LENGTH
    ) {
      alert(`Parol kamida ${MIN_PASSWORD_LENGTH} ta belgidan iborat bo'lishi kerak`);
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        directorName: formData.directorName.trim(),
        description: formData.description.trim(),
        status: formData.status,
      };

      if (formData.password.trim()) {
        payload.password = formData.password.trim();
      }

      if (formData.adminName.trim()) {
        payload.adminName = formData.adminName.trim();
      }

      if (editingId !== null) {
        await organizationsApi.update(editingId, payload);
      } else {
        await organizationsApi.create(payload);
      }

      await loadOrganizations(statusFilter);
      closeDrawer();
    } catch (err) {
      alert(err?.response?.data?.message || "Tashkilotni saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (organization) => {
    const confirmed = window.confirm(
      `"${organization.name}" tashkiloti o'chirilsinmi? Uning obunalari o'chadi va admin hisobi bloklanadi.`,
    );
    if (!confirmed) return;

    try {
      await organizationsApi.remove(organization.id);
      await loadOrganizations(statusFilter);
    } catch (err) {
      alert(err?.response?.data?.message || "Tashkilotni o'chirishda xatolik");
    }
  };

  const statusBadge = (status) => {
    const tone = STATUS_TONES[status] || STATUS_TONES.INACTIVE;
    return tone[darkMode ? "dark" : "light"];
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          icon="🏢"
          tone="violet"
          label="Jami tashkilotlar"
          value={loading ? "..." : stats.total}
        />
        <StatCard
          icon="✅"
          tone="emerald"
          label="Faol tashkilotlar"
          value={loading ? "..." : stats.active}
        />
        <StatCard
          icon="💎"
          tone="blue"
          label="Faol obunali"
          value={loading ? "..." : stats.withSubscription}
        />
      </div>

      <Card>
        <SectionHeader
          title="Tashkilotlar"
          subtitle="Tizimga ulangan o'quv markazlari"
          action={
            <button
              type="button"
              onClick={openAddDrawer}
              className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium"
            >
              + Tashkilot qo'shish
            </button>
          }
        />

        <div className="flex flex-wrap gap-2 mb-5">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              className={`px-4 py-2 rounded-xl border text-sm ${
                statusFilter === filter.value ? theme.tabActive : theme.tab
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-sm text-rose-500 mb-4">{error}</p>
        )}

        {loading ? (
          <p className={`text-sm ${theme.soft}`}>Yuklanmoqda...</p>
        ) : organizations.length === 0 ? (
          <p className={`text-sm ${theme.soft}`}>Tashkilot topilmadi</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {organizations.map((organization) => (
              <div
                key={organization.id}
                className={`rounded-2xl border p-5 ${theme.rowBorder}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3
                      className={`font-semibold break-words ${theme.text}`}
                    >
                      {organization.name}
                    </h3>
                    <p className={`text-xs mt-1 ${theme.soft}`}>
                      {organization.directorName || "Rahbar ko'rsatilmagan"}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 text-xs px-2.5 py-1 rounded-full ${statusBadge(
                      organization.status,
                    )}`}
                  >
                    {STATUS_LABELS[organization.status] || organization.status}
                  </span>
                </div>

                <div className={`mt-4 space-y-1 text-sm ${theme.soft}`}>
                  <p>📞 {organization.phone || "Telefon yo'q"}</p>
                  <p>
                    🔐{" "}
                    {organization.admin
                      ? `${organization.admin.fullName} · ${organization.admin.phone}`
                      : "Admin hisobi yo'q"}
                  </p>
                  <p>📍 {organization.address || "Manzil ko'rsatilmagan"}</p>
                  <p>
                    🛟 {organization._count?.supportTickets || 0} murojaat ·{" "}
                    {organization._count?.subscriptions || 0} obuna
                  </p>
                </div>

                <div className={`mt-4 pt-4 border-t ${theme.rowBorder}`}>
                  {organization.activeSubscription ? (
                    <div className="text-sm">
                      <p className={`font-semibold ${theme.text}`}>
                        {organization.activeSubscription.plan?.name ||
                          "Tarif"}{" "}
                        ·{" "}
                        {formatUzs(organization.activeSubscription.amount)}
                      </p>
                      <p className={`text-xs mt-1 ${theme.soft}`}>
                        {formatUzDate(
                          organization.activeSubscription.endDate,
                        )}{" "}
                        gacha
                      </p>
                    </div>
                  ) : (
                    <p className={`text-sm ${theme.soft}`}>Faol obuna yo'q</p>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => openEditDrawer(organization)}
                    className={`flex-1 py-2.5 rounded-xl border text-sm ${theme.rowBorder} ${theme.hover} ${theme.text}`}
                  >
                    ✏️ Tahrirlash
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(organization)}
                    className={`w-11 rounded-xl border flex items-center justify-center ${
                      darkMode
                        ? "border-slate-700 hover:bg-red-900/30"
                        : "border-slate-200 hover:bg-red-50"
                    }`}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

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
                {editingId !== null
                  ? "Tashkilotni tahrirlash"
                  : "Tashkilot qo'shish"}
              </h2>
              <button
                type="button"
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
                  Nomi *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Masalan: Najot Talim"
                  className={`w-full rounded-xl border px-4 py-3 outline-none ${theme.input}`}
                />
              </div>

              <div
                className={`rounded-2xl border p-4 space-y-4 ${theme.rowBorder}`}
              >
                <p className={`text-xs ${theme.soft}`}>
                  🔐 Admin hisobi — tashkilot shu telefon va parol bilan tizimga
                  kiradi.
                </p>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${theme.text}`}
                  >
                    Telefon (login) *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    autoComplete="off"
                    placeholder="+998901234567"
                    className={`w-full rounded-xl border px-4 py-3 outline-none ${theme.input}`}
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${theme.text}`}
                  >
                    Parol {editingId === null ? "*" : ""}
                  </label>
                  <PasswordInput
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={
                      editingId === null
                        ? `Kamida ${MIN_PASSWORD_LENGTH} ta belgi`
                        : "Bo'sh qoldirilsa o'zgarmaydi"
                    }
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${theme.text}`}
                  >
                    Admin F.I.O.
                  </label>
                  <input
                    type="text"
                    name="adminName"
                    value={formData.adminName}
                    onChange={handleChange}
                    placeholder="Bo'sh bo'lsa rahbar ismi olinadi"
                    className={`w-full rounded-xl border px-4 py-3 outline-none ${theme.input}`}
                  />
                </div>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${theme.text}`}
                >
                  Rahbar
                </label>
                <input
                  type="text"
                  name="directorName"
                  value={formData.directorName}
                  onChange={handleChange}
                  placeholder="F.I.O."
                  className={`w-full rounded-xl border px-4 py-3 outline-none ${theme.input}`}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${theme.text}`}
                >
                  Manzil
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Shahar, ko'cha"
                  className={`w-full rounded-xl border px-4 py-3 outline-none ${theme.input}`}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${theme.text}`}
                >
                  Izoh
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Qo'shimcha ma'lumot"
                  className={`w-full rounded-xl border px-4 py-3 outline-none resize-none ${theme.input}`}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${theme.text}`}
                >
                  Holati
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={`w-full rounded-xl border px-4 py-3 outline-none ${theme.select}`}
                >
                  <option value="ACTIVE">Faol</option>
                  <option value="INACTIVE">Nofaol</option>
                  <option value="FREEZE">Muzlatilgan</option>
                </select>
              </div>
            </div>

            <div
              className={`p-4 sm:p-6 flex flex-col sm:flex-row justify-end gap-3 border-t ${
                darkMode ? "border-slate-800" : "border-slate-200"
              }`}
            >
              <button
                type="button"
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
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium disabled:opacity-60"
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
