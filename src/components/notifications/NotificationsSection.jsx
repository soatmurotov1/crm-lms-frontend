import { useCallback, useEffect, useMemo, useState } from "react";
import Card from "../ui/Card";
import SectionHeader from "../ui/SectionHeader";
import {
  groupsApi,
  notificationsApi,
  organizationsApi,
  studentsApi,
  teachersApi,
  usersApi,
} from "../../api/crmApi";
import { formatUzDateTime } from "../../utils/date";
import { useTheme } from "../../theme/themeContext";
import Icon from "../ui/Icon";

const TYPE_META = {
  INFO: { label: "Ma'lumot", icon: "info", tone: "blue" },
  WARNING: { label: "Ogohlantirish", icon: "warning", tone: "amber" },
  PAYMENT: { label: "To'lov", icon: "payments", tone: "emerald" },
  LESSON: { label: "Dars", icon: "groups", tone: "violet" },
  HOMEWORK: { label: "Uy vazifa", icon: "homework", tone: "violet" },
  SYSTEM: { label: "Tizim", icon: "settings", tone: "slate" },
};

const TONE_CHIPS = {
  blue: { dark: "bg-accent-soft text-accent-soft-fg", light: "bg-accent-soft text-accent" },
  amber: {
    dark: "bg-warning-soft text-warning",
    light: "bg-warning-soft text-warning",
  },
  emerald: {
    dark: "bg-success-soft text-success",
    light: "bg-success-soft text-success",
  },
  violet: {
    dark: "bg-accent-soft text-accent-soft-fg",
    light: "bg-accent-soft text-accent",
  },
  slate: {
    dark: "bg-surface-3 text-fg-muted",
    light: "bg-surface-2 text-fg-muted",
  },
};

const AUDIENCE_LABELS = {
  ALL: "Hammaga",
  ADMINS: "Adminlarga",
  TEACHERS: "O'qituvchilarga",
  STUDENTS: "O'quvchilarga",
  GROUP: "Guruhga",
  ORGANIZATION: "Aniq tashkilotga",
  USER: "Aniq shaxsga",
};

/**
 * "Aniq shaxsga" rejimi: hisoblar uch xil jadvalda saqlanadi, shuning uchun
 * avval jadval (kind), so'ng shu jadvaldan shaxs tanlanadi. Backendga esa
 * tanlangan shaxsning haqiqiy roli (`recipientRole`) yuboriladi.
 */
const RECIPIENT_KINDS = [
  { value: "USER", label: "Admin / xodim" },
  { value: "TEACHER", label: "O'qituvchi" },
  { value: "STUDENT", label: "O'quvchi" },
];

const EMPTY_FORM = {
  title: "",
  message: "",
  type: "INFO",
  audience: "ALL",
  groupId: "",
  organizationId: "",
  recipientKind: "USER",
  recipientId: "",
};

const toList = (result) => (Array.isArray(result?.data) ? result.data : []);

/**
 * Barcha panellar uchun umumiy xabarnomalar bo'limi.
 *
 * canSend    — xabar yuborish formasi ko'rsatiladimi
 * canViewAll — "Yuborilganlar" tarixi (/notifications/all) mavjudmi
 * canDelete  — xabarnomani o'chirish tugmasi
 * groupOnly  — o'qituvchi rejimi: faqat o'z guruhiga yuborish
 * groups     — [{ id, name }] GROUP auditoriyasi uchun
 * canTargetOrganization — "Aniq tashkilotga" varianti (superadmin uchun)
 */
export default function NotificationsSection({
  canSend = false,
  canViewAll = false,
  canDelete = false,
  groupOnly = false,
  canTargetOrganization = false,
  groups = [],
  title = "Xabarnomalar",
  subtitle = "Sizga tegishli xabarnomalar",
}) {
  const { theme, darkMode } = useTheme();

  const [activeTab, setActiveTab] = useState("mine");
  const [mine, setMine] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    audience: groupOnly ? "GROUP" : "ALL",
  }));

  const audienceOptions = useMemo(() => {
    if (groupOnly) {
      return [
        { value: "GROUP", label: AUDIENCE_LABELS.GROUP },
        { value: "USER", label: "Aniq o'quvchiga" },
      ];
    }

    return Object.entries(AUDIENCE_LABELS)
      .filter(([value]) => value !== "ORGANIZATION" || canTargetOrganization)
      .map(([value, label]) => ({ value, label }));
  }, [groupOnly, canTargetOrganization]);

  // Qabul qiluvchilar ro'yxati faqat forma ochilganda yuklanadi — bu ro'yxatlar
  // xabarnomalar bo'limining asosiy yuklanishini sekinlashtirmasligi kerak.
  const [directory, setDirectory] = useState({
    organizations: [],
    USER: [],
    TEACHER: [],
    STUDENT: [],
  });
  const [directoryLoaded, setDirectoryLoaded] = useState(false);

  useEffect(() => {
    if (!canSend || !showForm || directoryLoaded) return;

    let cancelled = false;

    (async () => {
      const pick = (result) =>
        result.status === "fulfilled" ? toList(result.value) : [];

      /*
        O'qituvchida `/students/all` ga ruxsat yo'q — u o'quvchilarni faqat
        o'z guruhlari orqali ko'ra oladi. Shuning uchun ro'yxat guruhlardan
        yig'iladi va takrorlanganlari olib tashlanadi.
      */
      if (groupOnly) {
        const results = await Promise.allSettled(
          groups.map((group) => groupsApi.getStudentsByGroup(group.id)),
        );

        if (cancelled) return;

        const byId = new Map();
        results.forEach((result) =>
          pick(result).forEach((student) => byId.set(student.id, student)),
        );

        setDirectory((prev) => ({
          ...prev,
          STUDENT: [...byId.values()].sort((a, b) =>
            String(a.fullName || "").localeCompare(String(b.fullName || "")),
          ),
        }));
        setDirectoryLoaded(true);
        return;
      }

      const [usersRes, teachersRes, studentsRes, organizationsRes] =
        await Promise.allSettled([
          usersApi.getAll(),
          teachersApi.getAll(),
          studentsApi.getAll(),
          canTargetOrganization ? organizationsApi.getAll("ALL") : null,
        ]);

      if (cancelled) return;

      // Ruxsat yetmasa ro'yxat bo'sh qoladi, forma esa ishlashda davom etadi.
      setDirectory({
        USER: pick(usersRes),
        TEACHER: pick(teachersRes),
        STUDENT: pick(studentsRes),
        organizations: pick(organizationsRes),
      });
      setDirectoryLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [
    canSend,
    groupOnly,
    groups,
    showForm,
    directoryLoaded,
    canTargetOrganization,
  ]);

  // O'qituvchi rejimida qabul qiluvchi doim o'quvchi bo'ladi.
  const recipientKind = groupOnly ? "STUDENT" : form.recipientKind;
  const recipientOptions = directory[recipientKind] || [];

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const requests = [notificationsApi.getMine(100)];
      if (canViewAll) requests.push(notificationsApi.getAll(100));

      const [mineRes, sentRes] = await Promise.allSettled(requests);

      if (mineRes.status === "fulfilled") {
        setMine(
          Array.isArray(mineRes.value?.data) ? mineRes.value.data : [],
        );
        setUnreadCount(Number(mineRes.value?.unreadCount || 0));
      } else {
        setMine([]);
        setError(
          mineRes.reason?.response?.data?.message ||
            "Xabarnomalarni yuklashda xatolik",
        );
      }

      if (canViewAll) {
        setSent(
          sentRes?.status === "fulfilled" && Array.isArray(sentRes.value?.data)
            ? sentRes.value.data
            : [],
        );
      }
    } finally {
      setLoading(false);
    }
  }, [canViewAll]);

  useEffect(() => {
    load();
  }, [load]);

  const chipClass = (type) => {
    const meta = TYPE_META[type] || TYPE_META.INFO;
    return TONE_CHIPS[meta.tone][darkMode ? "dark" : "light"];
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
      // Jadval almashsa, oldingi jadvaldan tanlangan shaxs kuchini yo'qotadi.
      ...(name === "recipientKind" ? { recipientId: "" } : {}),
    }));
  };

  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      alert("Sarlavha va matn kiritilishi kerak");
      return;
    }

    if (form.audience === "GROUP" && !form.groupId) {
      alert("Guruh tanlanishi kerak");
      return;
    }

    if (form.audience === "ORGANIZATION" && !form.organizationId) {
      alert("Tashkilot tanlanishi kerak");
      return;
    }

    if (form.audience === "USER" && !form.recipientId) {
      alert("Qabul qiluvchi tanlanishi kerak");
      return;
    }

    let recipientRole;
    if (form.audience === "USER") {
      const recipient = recipientOptions.find(
        (item) => String(item.id) === String(form.recipientId),
      );

      // Xodimlar jadvalida rol har xil (ADMIN, MANAGEMENT, ...), o'qituvchi va
      // o'quvchi jadvallarida esa doim bitta.
      recipientRole =
        recipientKind === "USER" ? recipient?.role : recipientKind;

      if (!recipientRole) {
        alert("Qabul qiluvchi roli aniqlanmadi");
        return;
      }
    }

    try {
      setSending(true);
      await notificationsApi.create({
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type,
        audience: form.audience,
        groupId: form.audience === "GROUP" ? Number(form.groupId) : undefined,
        organizationId:
          form.audience === "ORGANIZATION"
            ? Number(form.organizationId)
            : undefined,
        recipientRole,
        recipientId:
          form.audience === "USER" ? Number(form.recipientId) : undefined,
      });

      setForm({ ...EMPTY_FORM, audience: groupOnly ? "GROUP" : "ALL" });
      setShowForm(false);
      await load();
    } catch (err) {
      alert(err?.response?.data?.message || "Xabarnoma yuborishda xatolik");
    } finally {
      setSending(false);
    }
  };

  const handleMarkAsRead = async (notification) => {
    if (notification.isRead) return;

    try {
      await notificationsApi.markAsRead(notification.id);
      setMine((prev) =>
        prev.map((item) =>
          item.id === notification.id ? { ...item, isRead: true } : item,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      alert(err?.response?.data?.message || "Belgilashda xatolik");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setMine((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      alert(err?.response?.data?.message || "Belgilashda xatolik");
    }
  };

  const handleDelete = async (notification) => {
    if (!window.confirm("Xabarnoma o'chirilsinmi?")) return;

    try {
      await notificationsApi.remove(notification.id);
      await load();
    } catch (err) {
      alert(err?.response?.data?.message || "O'chirishda xatolik");
    }
  };

  const renderNotification = (notification, options = {}) => {
    const meta = TYPE_META[notification.type] || TYPE_META.INFO;
    const isUnread = options.showRead && !notification.isRead;

    return (
      <div
        key={notification.id}
        className={`rounded-2xl border p-4 ${theme.rowBorder} ${
          isUnread ? (darkMode ? "bg-surface-2" : "bg-accent-soft") : ""
        }`}
      >
        <div className="flex items-start gap-3">
          <span
            className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${chipClass(
              notification.type,
            )}`}
          >
            {meta.icon}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <p className={`font-semibold break-words ${theme.text}`}>
                {notification.title}
              </p>
              {isUnread && (
                <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-accent mt-2" />
              )}
            </div>

            <p className={`text-sm mt-1 whitespace-pre-wrap ${theme.soft}`}>
              {notification.message}
            </p>

            <p className={`text-xs mt-2 ${theme.soft}`}>
              {AUDIENCE_LABELS[notification.audience] || notification.audience}
              {notification.group?.name ? ` · ${notification.group.name}` : ""}
              {notification.organization?.name
                ? ` · ${notification.organization.name}`
                : ""}
              {notification.recipientName
                ? ` · ${notification.recipientName}`
                : ""}
              {notification.createdByName
                ? ` · ${notification.createdByName}`
                : ""}{" "}
              · {formatUzDateTime(notification.created_at)}
              {options.showReadCount
                ? ` · ${notification._count?.reads || 0} o'qigan`
                : ""}
            </p>

            <div className="flex flex-wrap gap-2 mt-3">
              {options.showRead && !notification.isRead && (
                <button
                  type="button"
                  onClick={() => handleMarkAsRead(notification)}
                  className={`px-2.5 py-1.5 rounded-md border text-xs ${theme.rowBorder} ${theme.hover} ${theme.text}`}
                >
                  O'qildi
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  onClick={() => handleDelete(notification)}
                  className={`px-2.5 py-1.5 rounded-md border text-xs border-line hover:bg-danger-soft text-fg-muted`}
                >
                  <Icon name="trash" size={14} className="inline align-[-0.1875em]" /> O'chirish
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const list = activeTab === "sent" ? sent : mine;

  return (
    <Card>
      <SectionHeader
        title={title}
        subtitle={
          unreadCount > 0 ? `${unreadCount} ta o'qilmagan xabar` : subtitle
        }
        action={
          <div className="flex flex-wrap gap-2 justify-end">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className={`px-3.5 py-2 rounded-md border text-sm ${theme.rowBorder} ${theme.hover} ${theme.text}`}
              >
                Barchasini o'qildi
              </button>
            )}
            {canSend && (
              <button
                type="button"
                onClick={() => setShowForm((prev) => !prev)}
                className="bg-accent hover:bg-accent-hover text-white px-3.5 py-2 rounded-md text-sm font-medium"
              >
                {showForm ? "Yopish" : "+ Xabar yuborish"}
              </button>
            )}
          </div>
        }
      />

      {canSend && showForm && groupOnly && groups.length === 0 && (
        <div className={`rounded-2xl border p-4 mb-5 ${theme.rowBorder}`}>
          <p className={`text-sm ${theme.soft}`}>
            Sizga hali guruh biriktirilmagan, shuning uchun xabar yubora
            olmaysiz. Guruh biriktirilgach bu bo'lim ochiladi.
          </p>
        </div>
      )}

      {canSend && showForm && !(groupOnly && groups.length === 0) && (
        <div className={`rounded-2xl border p-4 mb-5 ${theme.rowBorder}`}>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleFormChange}
              placeholder="Sarlavha"
              className={`w-full field`}
            />

            <select
              name="type"
              value={form.type}
              onChange={handleFormChange}
              className={`w-full field`}
            >
              {Object.entries(TYPE_META).map(([value, meta]) => (
                <option key={value} value={value}>
                  {meta.icon} {meta.label}
                </option>
              ))}
            </select>

            <select
              name="audience"
              value={form.audience}
              onChange={handleFormChange}
              className={`w-full field`}
            >
              {audienceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {form.audience === "GROUP" && (
              <select
                name="groupId"
                value={form.groupId}
                onChange={handleFormChange}
                className={`w-full field`}
              >
                <option value="">Guruhni tanlang</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            )}

            {form.audience === "ORGANIZATION" && (
              <select
                name="organizationId"
                value={form.organizationId}
                onChange={handleFormChange}
                className={`w-full field`}
              >
                <option value="">
                  {directoryLoaded
                    ? "Tashkilotni tanlang"
                    : "Yuklanmoqda..."}
                </option>
                {directory.organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </select>
            )}

            {form.audience === "USER" && (
              <>
                {/* O'qituvchida tanlov yo'q — u faqat o'quvchiga yozadi. */}
                {!groupOnly && (
                  <select
                    name="recipientKind"
                    value={form.recipientKind}
                    onChange={handleFormChange}
                    className={`w-full field`}
                  >
                    {RECIPIENT_KINDS.map((kind) => (
                      <option key={kind.value} value={kind.value}>
                        {kind.label}
                      </option>
                    ))}
                  </select>
                )}

                <select
                  name="recipientId"
                  value={form.recipientId}
                  onChange={handleFormChange}
                  className={`w-full field`}
                >
                  <option value="">
                    {directoryLoaded ? "Shaxsni tanlang" : "Yuklanmoqda..."}
                  </option>
                  {recipientOptions.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.fullName}
                      {person.phone ? ` · ${person.phone}` : ""}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>

          <textarea
            name="message"
            value={form.message}
            onChange={handleFormChange}
            rows={4}
            placeholder="Xabar matni"
            className={`w-full rounded-xl border px-4 py-3 mt-3 outline-none resize-none ${theme.input}`}
          />

          <div className="flex justify-end mt-3">
            <button
              type="button"
              onClick={handleSend}
              disabled={sending}
              className="px-3.5 py-2 rounded-md bg-accent hover:bg-accent-hover text-white text-sm font-medium disabled:opacity-60"
            >
              {sending ? "Yuborilmoqda..." : "Yuborish"}
            </button>
          </div>
        </div>
      )}

      {canViewAll && (
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            type="button"
            onClick={() => setActiveTab("mine")}
            className={`px-3 py-1.5 rounded-md border text-sm ${
              activeTab === "mine" ? theme.tabActive : theme.tab
            }`}
          >
            Menga tegishli
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sent")}
            className={`px-3 py-1.5 rounded-md border text-sm ${
              activeTab === "sent" ? theme.tabActive : theme.tab
            }`}
          >
            Yuborilganlar
          </button>
        </div>
      )}

      {error && <p className="text-sm text-danger mb-4">{error}</p>}

      {loading ? (
        <p className={`text-sm ${theme.soft}`}>Yuklanmoqda...</p>
      ) : list.length === 0 ? (
        <p className={`text-sm ${theme.soft}`}>Xabarnoma yo'q</p>
      ) : (
        <div className="space-y-3">
          {list.map((notification) =>
            renderNotification(notification, {
              showRead: activeTab === "mine",
              showReadCount: activeTab === "sent",
            }),
          )}
        </div>
      )}
    </Card>
  );
}
