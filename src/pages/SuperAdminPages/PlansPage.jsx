import { useEffect, useMemo, useState } from "react";
import Card from "../../components/ui/Card";
import SectionHeader from "../../components/ui/SectionHeader";
import StatCard from "../../components/ui/StatCard";
import { organizationsApi, plansApi, subscriptionsApi } from "../../api/crmApi";
import { formatUzDate, toInputDate } from "../../utils/date";
import { useTheme } from "../../theme/themeContext";

const TABS = [
  { key: "plans", label: "Tariflar" },
  { key: "subscriptions", label: "Obunalar" },
];

const SUBSCRIPTION_FILTERS = [
  { value: "ALL", label: "Barchasi" },
  { value: "PENDING", label: "Kutilmoqda" },
  { value: "ACTIVE", label: "Faol" },
  { value: "EXPIRED", label: "Muddati tugagan" },
  { value: "CANCELED", label: "Bekor qilingan" },
];

const SUBSCRIPTION_LABELS = {
  PENDING: "Kutilmoqda",
  ACTIVE: "Faol",
  EXPIRED: "Muddati tugagan",
  CANCELED: "Bekor qilingan",
};

const SUBSCRIPTION_TONES = {
  PENDING: {
    dark: "bg-amber-500/15 text-amber-300",
    light: "bg-amber-50 text-amber-600",
  },
  ACTIVE: {
    dark: "bg-emerald-500/15 text-emerald-300",
    light: "bg-emerald-50 text-emerald-600",
  },
  EXPIRED: {
    dark: "bg-slate-500/15 text-slate-300",
    light: "bg-slate-100 text-slate-600",
  },
  CANCELED: {
    dark: "bg-rose-500/15 text-rose-300",
    light: "bg-rose-50 text-rose-600",
  },
};

const EMPTY_PLAN_FORM = {
  name: "",
  price: "",
  durationMonth: "1",
  maxStudents: "",
  maxTeachers: "",
  maxGroups: "",
  description: "",
  features: "",
  status: "ACTIVE",
};

const EMPTY_SUBSCRIPTION_FORM = {
  organizationId: "",
  planId: "",
  startDate: "",
  endDate: "",
  amount: "",
  status: "PENDING",
  comment: "",
};

const formatUzs = (value) =>
  `${new Intl.NumberFormat("uz-UZ").format(Number(value || 0))} so'm`;

const toNumberOrUndefined = (value) => {
  const trimmed = String(value ?? "").trim();
  return trimmed === "" ? undefined : Number(trimmed);
};

export default function PlansPage() {
  const { theme, darkMode } = useTheme();

  const [activeTab, setActiveTab] = useState("plans");
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [summary, setSummary] = useState(null);
  const [subscriptionFilter, setSubscriptionFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [planDrawer, setPlanDrawer] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [planForm, setPlanForm] = useState(EMPTY_PLAN_FORM);

  const [subscriptionDrawer, setSubscriptionDrawer] = useState(false);
  const [editingSubscriptionId, setEditingSubscriptionId] = useState(null);
  const [subscriptionForm, setSubscriptionForm] = useState(
    EMPTY_SUBSCRIPTION_FORM,
  );

  const loadAll = async (filter = subscriptionFilter) => {
    try {
      setLoading(true);
      setError("");

      const [plansRes, subscriptionsRes, organizationsRes, summaryRes] =
        await Promise.allSettled([
          plansApi.getAll("ALL"),
          subscriptionsApi.getAll(
            filter && filter !== "ALL" ? { status: filter } : {},
          ),
          organizationsApi.getAll("ALL"),
          subscriptionsApi.getSummary(),
        ]);

      const toList = (result) =>
        result?.status === "fulfilled" && Array.isArray(result.value?.data)
          ? result.value.data
          : [];

      setPlans(toList(plansRes));
      setSubscriptions(toList(subscriptionsRes));
      setOrganizations(toList(organizationsRes));
      setSummary(
        summaryRes?.status === "fulfilled" ? summaryRes.value?.data : null,
      );

      if (plansRes.status === "rejected") {
        setError(
          plansRes.reason?.response?.data?.message ||
            "Tariflarni yuklashda xatolik",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll(subscriptionFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptionFilter]);

  const planById = useMemo(
    () => Object.fromEntries(plans.map((plan) => [plan.id, plan])),
    [plans],
  );

  const subscriptionTone = (status) => {
    const tone = SUBSCRIPTION_TONES[status] || SUBSCRIPTION_TONES.EXPIRED;
    return tone[darkMode ? "dark" : "light"];
  };

  // ---- Tarif (plan) ----------------------------------------------------

  const openPlanDrawer = (plan) => {
    if (plan) {
      setEditingPlanId(plan.id);
      setPlanForm({
        name: plan.name || "",
        price: String(plan.price ?? ""),
        durationMonth: String(plan.durationMonth ?? "1"),
        maxStudents: plan.maxStudents == null ? "" : String(plan.maxStudents),
        maxTeachers: plan.maxTeachers == null ? "" : String(plan.maxTeachers),
        maxGroups: plan.maxGroups == null ? "" : String(plan.maxGroups),
        description: plan.description || "",
        features: (plan.features || []).join("\n"),
        status: plan.status || "ACTIVE",
      });
    } else {
      setEditingPlanId(null);
      setPlanForm(EMPTY_PLAN_FORM);
    }
    setPlanDrawer(true);
  };

  const closePlanDrawer = () => {
    setPlanDrawer(false);
    setEditingPlanId(null);
    setPlanForm(EMPTY_PLAN_FORM);
  };

  const handlePlanChange = (event) => {
    const { name, value } = event.target;
    setPlanForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlanSave = async () => {
    if (!planForm.name.trim() || String(planForm.price).trim() === "") {
      alert("Tarif nomi va narxi kiritilishi kerak");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: planForm.name.trim(),
        price: Number(planForm.price),
        durationMonth: toNumberOrUndefined(planForm.durationMonth),
        maxStudents: toNumberOrUndefined(planForm.maxStudents),
        maxTeachers: toNumberOrUndefined(planForm.maxTeachers),
        maxGroups: toNumberOrUndefined(planForm.maxGroups),
        description: planForm.description.trim() || undefined,
        features: planForm.features
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
        status: planForm.status,
      };

      if (editingPlanId !== null) {
        await plansApi.update(editingPlanId, payload);
      } else {
        await plansApi.create(payload);
      }

      await loadAll(subscriptionFilter);
      closePlanDrawer();
    } catch (err) {
      alert(err?.response?.data?.message || "Tarifni saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  };

  const handlePlanDelete = async (plan) => {
    if (!window.confirm(`"${plan.name}" tarifi o'chirilsinmi?`)) return;

    try {
      await plansApi.remove(plan.id);
      await loadAll(subscriptionFilter);
    } catch (err) {
      alert(err?.response?.data?.message || "Tarifni o'chirishda xatolik");
    }
  };

  // ---- Obuna (subscription) --------------------------------------------

  const openSubscriptionDrawer = (subscription) => {
    if (subscription) {
      setEditingSubscriptionId(subscription.id);
      setSubscriptionForm({
        organizationId: String(subscription.organizationId ?? ""),
        planId: String(subscription.planId ?? ""),
        startDate: toInputDate(subscription.startDate),
        endDate: toInputDate(subscription.endDate),
        amount: String(subscription.amount ?? ""),
        status: subscription.status || "PENDING",
        comment: subscription.comment || "",
      });
    } else {
      setEditingSubscriptionId(null);
      setSubscriptionForm(EMPTY_SUBSCRIPTION_FORM);
    }
    setSubscriptionDrawer(true);
  };

  const closeSubscriptionDrawer = () => {
    setSubscriptionDrawer(false);
    setEditingSubscriptionId(null);
    setSubscriptionForm(EMPTY_SUBSCRIPTION_FORM);
  };

  const handleSubscriptionChange = (event) => {
    const { name, value } = event.target;
    setSubscriptionForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubscriptionSave = async () => {
    if (!subscriptionForm.organizationId || !subscriptionForm.planId) {
      alert("Tashkilot va tarif tanlanishi kerak");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        organizationId: Number(subscriptionForm.organizationId),
        planId: Number(subscriptionForm.planId),
        startDate: subscriptionForm.startDate || undefined,
        endDate: subscriptionForm.endDate || undefined,
        amount: toNumberOrUndefined(subscriptionForm.amount),
        status: subscriptionForm.status,
        comment: subscriptionForm.comment.trim() || undefined,
      };

      if (editingSubscriptionId !== null) {
        await subscriptionsApi.update(editingSubscriptionId, payload);
      } else {
        await subscriptionsApi.create(payload);
      }

      await loadAll(subscriptionFilter);
      closeSubscriptionDrawer();
    } catch (err) {
      alert(err?.response?.data?.message || "Obunani saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  };

  const handleSubscriptionStatus = async (subscription, status) => {
    try {
      await subscriptionsApi.update(subscription.id, { status });
      await loadAll(subscriptionFilter);
    } catch (err) {
      alert(err?.response?.data?.message || "Holatni o'zgartirishda xatolik");
    }
  };

  const handleSubscriptionDelete = async (subscription) => {
    if (!window.confirm("Obuna o'chirilsinmi?")) return;

    try {
      await subscriptionsApi.remove(subscription.id);
      await loadAll(subscriptionFilter);
    } catch (err) {
      alert(err?.response?.data?.message || "Obunani o'chirishda xatolik");
    }
  };

  // ---- Ko'rinish --------------------------------------------------------

  const renderPlans = () => (
    <Card>
      <SectionHeader
        title="Tariflar"
        subtitle="Tashkilotlar to'laydigan obuna rejalari"
        action={
          <button
            type="button"
            onClick={() => openPlanDrawer(null)}
            className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium"
          >
            + Tarif qo'shish
          </button>
        }
      />

      {error && <p className="text-sm text-rose-500 mb-4">{error}</p>}

      {loading ? (
        <p className={`text-sm ${theme.soft}`}>Yuklanmoqda...</p>
      ) : plans.length === 0 ? (
        <p className={`text-sm ${theme.soft}`}>Tarif topilmadi</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl border p-5 ${theme.rowBorder}`}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className={`font-semibold break-words ${theme.text}`}>
                  {plan.name}
                </h3>
                <span
                  className={`shrink-0 text-xs px-2.5 py-1 rounded-full ${
                    plan.status === "ACTIVE"
                      ? subscriptionTone("ACTIVE")
                      : subscriptionTone("EXPIRED")
                  }`}
                >
                  {plan.status === "ACTIVE" ? "Faol" : "Nofaol"}
                </span>
              </div>

              <p className={`text-2xl font-bold mt-3 ${theme.text}`}>
                {formatUzs(plan.price)}
              </p>
              <p className={`text-xs mt-1 ${theme.soft}`}>
                {plan.durationMonth || 1} oyga
              </p>

              <div
                className={`mt-4 pt-4 border-t text-sm space-y-1 ${theme.rowBorder} ${theme.soft}`}
              >
                <p>
                  🎓 {plan.maxStudents ?? "∞"} o'quvchi · 👨‍🏫{" "}
                  {plan.maxTeachers ?? "∞"} o'qituvchi
                </p>
                <p>📚 {plan.maxGroups ?? "∞"} guruh</p>
                {plan.description && <p>{plan.description}</p>}
              </div>

              {(plan.features || []).length > 0 && (
                <ul className={`mt-3 space-y-1 text-sm ${theme.soft}`}>
                  {plan.features.map((feature) => (
                    <li key={feature}>✅ {feature}</li>
                  ))}
                </ul>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => openPlanDrawer(plan)}
                  className={`flex-1 py-2.5 rounded-xl border text-sm ${theme.rowBorder} ${theme.hover} ${theme.text}`}
                >
                  ✏️ Tahrirlash
                </button>
                <button
                  type="button"
                  onClick={() => handlePlanDelete(plan)}
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
  );

  const renderSubscriptions = () => (
    <Card>
      <SectionHeader
        title="Obunalar"
        subtitle="Tashkilotlarning tarif obunalari"
        action={
          <button
            type="button"
            onClick={() => openSubscriptionDrawer(null)}
            className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium"
          >
            + Obuna qo'shish
          </button>
        }
      />

      <div className="flex flex-wrap gap-2 mb-5">
        {SUBSCRIPTION_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setSubscriptionFilter(filter.value)}
            className={`px-4 py-2 rounded-xl border text-sm ${
              subscriptionFilter === filter.value ? theme.tabActive : theme.tab
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className={`text-sm ${theme.soft}`}>Yuklanmoqda...</p>
      ) : subscriptions.length === 0 ? (
        <p className={`text-sm ${theme.soft}`}>Obuna topilmadi</p>
      ) : (
        <div className="space-y-3">
          {subscriptions.map((subscription) => (
            <div
              key={subscription.id}
              className={`rounded-2xl border p-4 ${theme.rowBorder}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={`font-semibold ${theme.text}`}>
                    {subscription.organization?.name || "Tashkilot"}
                  </p>
                  <p className={`text-sm mt-1 ${theme.soft}`}>
                    {subscription.plan?.name || "Tarif"} ·{" "}
                    {formatUzs(subscription.amount)}
                  </p>
                  <p className={`text-xs mt-1 ${theme.soft}`}>
                    {formatUzDate(subscription.startDate)} —{" "}
                    {formatUzDate(subscription.endDate)}
                  </p>
                  {subscription.comment && (
                    <p className={`text-xs mt-1 ${theme.soft}`}>
                      💬 {subscription.comment}
                    </p>
                  )}
                </div>

                <span
                  className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${subscriptionTone(
                    subscription.status,
                  )}`}
                >
                  {SUBSCRIPTION_LABELS[subscription.status] ||
                    subscription.status}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {subscription.status !== "ACTIVE" && (
                  <button
                    type="button"
                    onClick={() =>
                      handleSubscriptionStatus(subscription, "ACTIVE")
                    }
                    className="px-4 py-2 rounded-xl text-sm bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Faollashtirish
                  </button>
                )}
                {subscription.status !== "CANCELED" && (
                  <button
                    type="button"
                    onClick={() =>
                      handleSubscriptionStatus(subscription, "CANCELED")
                    }
                    className={`px-4 py-2 rounded-xl border text-sm ${theme.rowBorder} ${theme.hover} ${theme.text}`}
                  >
                    Bekor qilish
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openSubscriptionDrawer(subscription)}
                  className={`px-4 py-2 rounded-xl border text-sm ${theme.rowBorder} ${theme.hover} ${theme.text}`}
                >
                  ✏️ Tahrirlash
                </button>
                <button
                  type="button"
                  onClick={() => handleSubscriptionDelete(subscription)}
                  className={`px-4 py-2 rounded-xl border text-sm ${
                    darkMode
                      ? "border-slate-700 hover:bg-red-900/30 text-slate-300"
                      : "border-slate-200 hover:bg-red-50 text-slate-600"
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
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          icon="💎"
          tone="violet"
          label="Tariflar"
          value={loading ? "..." : plans.length}
        />
        <StatCard
          icon="✅"
          tone="emerald"
          label="Faol obunalar"
          value={loading ? "..." : (summary?.ACTIVE ?? 0)}
        />
        <StatCard
          icon="⏳"
          tone="amber"
          label="Muddati tugayapti"
          value={loading ? "..." : (summary?.expiringSoon ?? 0)}
          deltaLabel="7 kun ichida"
        />
        <StatCard
          icon="💰"
          tone="blue"
          label="Obunalar summasi"
          value={loading ? "..." : formatUzs(summary?.totalAmount)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 rounded-xl border text-sm font-medium ${
              activeTab === tab.key ? theme.tabActive : theme.tab
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "plans" ? renderPlans() : renderSubscriptions()}

      {planDrawer && (
        <div className={`fixed inset-0 z-50 ${theme.overlay}`}>
          <div className="absolute inset-0" onClick={closePlanDrawer} />

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
                {editingPlanId !== null
                  ? "Tarifni tahrirlash"
                  : "Tarif qo'shish"}
              </h2>
              <button
                type="button"
                onClick={closePlanDrawer}
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
                  value={planForm.name}
                  onChange={handlePlanChange}
                  placeholder="Masalan: Standart"
                  className={`w-full rounded-xl border px-4 py-3 outline-none ${theme.input}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${theme.text}`}
                  >
                    Narxi *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={planForm.price}
                    onChange={handlePlanChange}
                    placeholder="500000"
                    className={`w-full rounded-xl border px-4 py-3 outline-none ${theme.input}`}
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${theme.text}`}
                  >
                    Davomiyligi (oy)
                  </label>
                  <input
                    type="number"
                    name="durationMonth"
                    value={planForm.durationMonth}
                    onChange={handlePlanChange}
                    placeholder="1"
                    className={`w-full rounded-xl border px-4 py-3 outline-none ${theme.input}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${theme.text}`}
                  >
                    O'quvchi
                  </label>
                  <input
                    type="number"
                    name="maxStudents"
                    value={planForm.maxStudents}
                    onChange={handlePlanChange}
                    placeholder="200"
                    className={`w-full rounded-xl border px-3 py-3 outline-none ${theme.input}`}
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${theme.text}`}
                  >
                    O'qituvchi
                  </label>
                  <input
                    type="number"
                    name="maxTeachers"
                    value={planForm.maxTeachers}
                    onChange={handlePlanChange}
                    placeholder="20"
                    className={`w-full rounded-xl border px-3 py-3 outline-none ${theme.input}`}
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${theme.text}`}
                  >
                    Guruh
                  </label>
                  <input
                    type="number"
                    name="maxGroups"
                    value={planForm.maxGroups}
                    onChange={handlePlanChange}
                    placeholder="30"
                    className={`w-full rounded-xl border px-3 py-3 outline-none ${theme.input}`}
                  />
                </div>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${theme.text}`}
                >
                  Izoh
                </label>
                <textarea
                  name="description"
                  value={planForm.description}
                  onChange={handlePlanChange}
                  rows={2}
                  className={`w-full rounded-xl border px-4 py-3 outline-none resize-none ${theme.input}`}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${theme.text}`}
                >
                  Imkoniyatlar (har biri yangi qatorda)
                </label>
                <textarea
                  name="features"
                  value={planForm.features}
                  onChange={handlePlanChange}
                  rows={4}
                  placeholder={"SMS xabarnoma\nHisobotlar"}
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
                  value={planForm.status}
                  onChange={handlePlanChange}
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
                onClick={closePlanDrawer}
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
                onClick={handlePlanSave}
                disabled={saving}
                className="px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium disabled:opacity-60"
              >
                {saving ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </div>
          </div>
        </div>
      )}

      {subscriptionDrawer && (
        <div className={`fixed inset-0 z-50 ${theme.overlay}`}>
          <div className="absolute inset-0" onClick={closeSubscriptionDrawer} />

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
                {editingSubscriptionId !== null
                  ? "Obunani tahrirlash"
                  : "Obuna qo'shish"}
              </h2>
              <button
                type="button"
                onClick={closeSubscriptionDrawer}
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
                  Tashkilot *
                </label>
                <select
                  name="organizationId"
                  value={subscriptionForm.organizationId}
                  onChange={handleSubscriptionChange}
                  className={`w-full rounded-xl border px-4 py-3 outline-none ${theme.select}`}
                >
                  <option value="">Tanlang</option>
                  {organizations.map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${theme.text}`}
                >
                  Tarif *
                </label>
                <select
                  name="planId"
                  value={subscriptionForm.planId}
                  onChange={handleSubscriptionChange}
                  className={`w-full rounded-xl border px-4 py-3 outline-none ${theme.select}`}
                >
                  <option value="">Tanlang</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} — {formatUzs(plan.price)}
                    </option>
                  ))}
                </select>
                {subscriptionForm.planId &&
                  planById[Number(subscriptionForm.planId)] && (
                    <p className={`text-xs mt-2 ${theme.soft}`}>
                      Muddati:{" "}
                      {planById[Number(subscriptionForm.planId)]
                        .durationMonth || 1}{" "}
                      oy. Summa va tugash sanasi bo'sh qoldirilsa, tarifdan
                      olinadi.
                    </p>
                  )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${theme.text}`}
                  >
                    Boshlanish
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={subscriptionForm.startDate}
                    onChange={handleSubscriptionChange}
                    className={`w-full rounded-xl border px-3 py-3 outline-none ${theme.input}`}
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${theme.text}`}
                  >
                    Tugash
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={subscriptionForm.endDate}
                    onChange={handleSubscriptionChange}
                    className={`w-full rounded-xl border px-3 py-3 outline-none ${theme.input}`}
                  />
                </div>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${theme.text}`}
                >
                  Summa
                </label>
                <input
                  type="number"
                  name="amount"
                  value={subscriptionForm.amount}
                  onChange={handleSubscriptionChange}
                  placeholder="Bo'sh qoldirilsa tarif narxi"
                  className={`w-full rounded-xl border px-4 py-3 outline-none ${theme.input}`}
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
                  value={subscriptionForm.status}
                  onChange={handleSubscriptionChange}
                  className={`w-full rounded-xl border px-4 py-3 outline-none ${theme.select}`}
                >
                  <option value="PENDING">Kutilmoqda</option>
                  <option value="ACTIVE">Faol</option>
                  <option value="EXPIRED">Muddati tugagan</option>
                  <option value="CANCELED">Bekor qilingan</option>
                </select>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${theme.text}`}
                >
                  Izoh
                </label>
                <textarea
                  name="comment"
                  value={subscriptionForm.comment}
                  onChange={handleSubscriptionChange}
                  rows={3}
                  className={`w-full rounded-xl border px-4 py-3 outline-none resize-none ${theme.input}`}
                />
              </div>
            </div>

            <div
              className={`p-4 sm:p-6 flex flex-col sm:flex-row justify-end gap-3 border-t ${
                darkMode ? "border-slate-800" : "border-slate-200"
              }`}
            >
              <button
                type="button"
                onClick={closeSubscriptionDrawer}
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
                onClick={handleSubscriptionSave}
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
