import { useCallback, useEffect, useMemo, useState } from "react";
import Card from "../ui/Card";
import SectionHeader from "../ui/SectionHeader";
import { notificationsApi } from "../../api/crmApi";
import { formatUzDateTime } from "../../utils/date";
import { useTheme } from "../../theme/themeContext";

const TYPE_META = {
  INFO: { label: "Ma'lumot", icon: "ℹ️", tone: "blue" },
  WARNING: { label: "Ogohlantirish", icon: "⚠️", tone: "amber" },
  PAYMENT: { label: "To'lov", icon: "💳", tone: "emerald" },
  LESSON: { label: "Dars", icon: "📚", tone: "violet" },
  HOMEWORK: { label: "Uy vazifa", icon: "📝", tone: "violet" },
  SYSTEM: { label: "Tizim", icon: "⚙️", tone: "slate" },
};

const TONE_CHIPS = {
  blue: { dark: "bg-blue-500/15 text-blue-300", light: "bg-blue-50 text-blue-600" },
  amber: {
    dark: "bg-amber-500/15 text-amber-300",
    light: "bg-amber-50 text-amber-600",
  },
  emerald: {
    dark: "bg-emerald-500/15 text-emerald-300",
    light: "bg-emerald-50 text-emerald-600",
  },
  violet: {
    dark: "bg-violet-500/15 text-violet-300",
    light: "bg-violet-50 text-violet-600",
  },
  slate: {
    dark: "bg-slate-500/15 text-slate-300",
    light: "bg-slate-100 text-slate-600",
  },
};

const AUDIENCE_LABELS = {
  ALL: "Hammaga",
  ADMINS: "Adminlarga",
  TEACHERS: "O'qituvchilarga",
  STUDENTS: "O'quvchilarga",
  GROUP: "Guruhga",
};

const EMPTY_FORM = {
  title: "",
  message: "",
  type: "INFO",
  audience: "ALL",
  groupId: "",
};

/**
 * Barcha panellar uchun umumiy xabarnomalar bo'limi.
 *
 * canSend    — xabar yuborish formasi ko'rsatiladimi
 * canViewAll — "Yuborilganlar" tarixi (/notifications/all) mavjudmi
 * canDelete  — xabarnomani o'chirish tugmasi
 * groupOnly  — o'qituvchi rejimi: faqat o'z guruhiga yuborish
 * groups     — [{ id, name }] GROUP auditoriyasi uchun
 */
export default function NotificationsSection({
  canSend = false,
  canViewAll = false,
  canDelete = false,
  groupOnly = false,
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

  const audienceOptions = useMemo(
    () =>
      groupOnly
        ? [{ value: "GROUP", label: AUDIENCE_LABELS.GROUP }]
        : Object.entries(AUDIENCE_LABELS).map(([value, label]) => ({
            value,
            label,
          })),
    [groupOnly],
  );

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
    setForm((prev) => ({ ...prev, [name]: value }));
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

    try {
      setSending(true);
      await notificationsApi.create({
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type,
        audience: form.audience,
        groupId: form.audience === "GROUP" ? Number(form.groupId) : undefined,
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
          isUnread ? (darkMode ? "bg-slate-800/40" : "bg-violet-50/40") : ""
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
                <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-violet-500 mt-2" />
              )}
            </div>

            <p className={`text-sm mt-1 whitespace-pre-wrap ${theme.soft}`}>
              {notification.message}
            </p>

            <p className={`text-xs mt-2 ${theme.soft}`}>
              {AUDIENCE_LABELS[notification.audience] || notification.audience}
              {notification.group?.name ? ` · ${notification.group.name}` : ""}
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
                  className={`px-3 py-1.5 rounded-xl border text-xs ${theme.rowBorder} ${theme.hover} ${theme.text}`}
                >
                  O'qildi
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  onClick={() => handleDelete(notification)}
                  className={`px-3 py-1.5 rounded-xl border text-xs ${
                    darkMode
                      ? "border-slate-700 hover:bg-red-900/30 text-slate-300"
                      : "border-slate-200 hover:bg-red-50 text-slate-600"
                  }`}
                >
                  🗑️ O'chirish
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
                className={`px-4 py-2.5 rounded-xl border text-sm ${theme.rowBorder} ${theme.hover} ${theme.text}`}
              >
                Barchasini o'qildi
              </button>
            )}
            {canSend && (
              <button
                type="button"
                onClick={() => setShowForm((prev) => !prev)}
                className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium"
              >
                {showForm ? "Yopish" : "+ Xabar yuborish"}
              </button>
            )}
          </div>
        }
      />

      {canSend && showForm && (
        <div className={`rounded-2xl border p-4 mb-5 ${theme.rowBorder}`}>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleFormChange}
              placeholder="Sarlavha"
              className={`w-full rounded-xl border px-4 py-3 outline-none ${theme.input}`}
            />

            <select
              name="type"
              value={form.type}
              onChange={handleFormChange}
              className={`w-full rounded-xl border px-4 py-3 outline-none ${theme.select}`}
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
              className={`w-full rounded-xl border px-4 py-3 outline-none ${theme.select}`}
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
                className={`w-full rounded-xl border px-4 py-3 outline-none ${theme.select}`}
              >
                <option value="">Guruhni tanlang</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
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
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium disabled:opacity-60"
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
            className={`px-4 py-2 rounded-xl border text-sm ${
              activeTab === "mine" ? theme.tabActive : theme.tab
            }`}
          >
            Menga tegishli
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sent")}
            className={`px-4 py-2 rounded-xl border text-sm ${
              activeTab === "sent" ? theme.tabActive : theme.tab
            }`}
          >
            Yuborilganlar
          </button>
        </div>
      )}

      {error && <p className="text-sm text-rose-500 mb-4">{error}</p>}

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
