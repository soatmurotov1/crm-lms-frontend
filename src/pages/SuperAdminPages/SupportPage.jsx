import { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import SectionHeader from "../../components/ui/SectionHeader";
import StatCard from "../../components/ui/StatCard";
import { organizationsApi, supportApi } from "../../api/crmApi";
import { formatUzDateTime } from "../../utils/date";
import { useTheme } from "../../theme/themeContext";
import Icon from "../../components/ui/Icon";

const STATUS_FILTERS = [
  { value: "ALL", label: "Barchasi" },
  { value: "OPEN", label: "Ochiq" },
  { value: "IN_PROGRESS", label: "Ko'rilmoqda" },
  { value: "ANSWERED", label: "Javob berilgan" },
  { value: "CLOSED", label: "Yopilgan" },
];

const STATUS_LABELS = {
  OPEN: "Ochiq",
  IN_PROGRESS: "Ko'rilmoqda",
  ANSWERED: "Javob berilgan",
  CLOSED: "Yopilgan",
};

const STATUS_TONES = {
  OPEN: {
    dark: "bg-warning-soft text-warning",
    light: "bg-warning-soft text-warning",
  },
  IN_PROGRESS: {
    dark: "bg-accent-soft text-accent-soft-fg",
    light: "bg-accent-soft text-accent",
  },
  ANSWERED: {
    dark: "bg-success-soft text-success",
    light: "bg-success-soft text-success",
  },
  CLOSED: {
    dark: "bg-surface-3 text-fg-muted",
    light: "bg-surface-2 text-fg-muted",
  },
};

const PRIORITY_LABELS = {
  LOW: "Past",
  NORMAL: "O'rtacha",
  HIGH: "Yuqori",
  URGENT: "Shoshilinch",
};

const ROLE_LABELS = {
  SUPERADMIN: "Super admin",
  ADMIN: "Admin",
  MANAGEMENT: "Menejer",
  ADMINSTRATOR: "Administrator",
  TEACHER: "O'qituvchi",
  STUDENT: "O'quvchi",
};

const EMPTY_TICKET_FORM = {
  subject: "",
  message: "",
  priority: "NORMAL",
  contactPhone: "",
  organizationId: "",
};

/**
 * Murojaatlar bo'limi. `canManage` — xodim rollari uchun (holatni o'zgartirish,
 * o'chirish); oddiy foydalanuvchi faqat o'z murojaatlarini ko'radi va yozadi.
 */
export default function SupportPage({ canManage = true }) {
  const { theme, darkMode } = useTheme();

  const [tickets, setTickets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_TICKET_FORM);
  const [saving, setSaving] = useState(false);

  const loadTickets = async (status = statusFilter) => {
    try {
      setLoading(true);
      setError("");
      const result = await supportApi.getAll(status);
      setTickets(Array.isArray(result?.data) ? result.data : []);
    } catch (err) {
      setTickets([]);
      setError(err?.response?.data?.message || "Murojaatlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    if (!canManage) return;

    let isMounted = true;

    const loadExtras = async () => {
      const [summaryRes, organizationsRes] = await Promise.allSettled([
        supportApi.getSummary(),
        organizationsApi.getAll("ALL"),
      ]);

      if (!isMounted) return;

      if (summaryRes.status === "fulfilled") {
        setSummary(summaryRes.value?.data || null);
      }
      if (
        organizationsRes.status === "fulfilled" &&
        Array.isArray(organizationsRes.value?.data)
      ) {
        setOrganizations(organizationsRes.value.data);
      }
    };

    loadExtras();
    return () => {
      isMounted = false;
    };
  }, [canManage]);

  const statusTone = (status) => {
    const tone = STATUS_TONES[status] || STATUS_TONES.CLOSED;
    return tone[darkMode ? "dark" : "light"];
  };

  const openTicket = async (ticket) => {
    try {
      setTicketLoading(true);
      setReplyText("");
      const result = await supportApi.getOne(ticket.id);
      setSelectedTicket(result?.data || null);
    } catch (err) {
      alert(err?.response?.data?.message || "Murojaatni ochishda xatolik");
    } finally {
      setTicketLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;

    try {
      setReplying(true);
      await supportApi.reply(selectedTicket.id, { message: replyText.trim() });
      setReplyText("");
      const refreshed = await supportApi.getOne(selectedTicket.id);
      setSelectedTicket(refreshed?.data || null);
      await loadTickets(statusFilter);
    } catch (err) {
      alert(err?.response?.data?.message || "Javob yuborishda xatolik");
    } finally {
      setReplying(false);
    }
  };

  const handleStatusChange = async (ticket, status) => {
    try {
      await supportApi.update(ticket.id, { status });
      await loadTickets(statusFilter);
      if (selectedTicket?.id === ticket.id) {
        const refreshed = await supportApi.getOne(ticket.id);
        setSelectedTicket(refreshed?.data || null);
      }
      if (canManage) {
        const summaryRes = await supportApi.getSummary();
        setSummary(summaryRes?.data || null);
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Holatni o'zgartirishda xatolik");
    }
  };

  const handleDelete = async (ticket) => {
    if (!window.confirm("Murojaat o'chirilsinmi?")) return;

    try {
      await supportApi.remove(ticket.id);
      if (selectedTicket?.id === ticket.id) setSelectedTicket(null);
      await loadTickets(statusFilter);
    } catch (err) {
      alert(err?.response?.data?.message || "Murojaatni o'chirishda xatolik");
    }
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async () => {
    if (!form.subject.trim() || !form.message.trim()) {
      alert("Mavzu va matn kiritilishi kerak");
      return;
    }

    try {
      setSaving(true);
      await supportApi.create({
        subject: form.subject.trim(),
        message: form.message.trim(),
        priority: form.priority,
        contactPhone: form.contactPhone.trim() || undefined,
        organizationId: form.organizationId
          ? Number(form.organizationId)
          : undefined,
      });
      setForm(EMPTY_TICKET_FORM);
      setShowForm(false);
      await loadTickets(statusFilter);
    } catch (err) {
      alert(err?.response?.data?.message || "Murojaatni yuborishda xatolik");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {canManage && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <StatCard
            icon="inbox"
            tone="amber"
            label="Ochiq murojaatlar"
            value={loading ? "..." : (summary?.OPEN ?? 0)}
          />
          <StatCard
            icon="refresh"
            tone="blue"
            label="Ko'rilmoqda"
            value={loading ? "..." : (summary?.IN_PROGRESS ?? 0)}
          />
          <StatCard
            icon="checkCircle"
            tone="emerald"
            label="Javob berilgan"
            value={loading ? "..." : (summary?.ANSWERED ?? 0)}
          />
          <StatCard
            icon="folder"
            tone="violet"
            label="Jami"
            value={loading ? "..." : (summary?.total ?? tickets.length)}
          />
        </div>
      )}

      <Card>
        <SectionHeader
          title="Murojaatlar"
          subtitle={
            canManage
              ? "Tashkilotlar va foydalanuvchilardan kelgan murojaatlar"
              : "Sizning murojaatlaringiz"
          }
          action={
            <button
              type="button"
              onClick={() => setShowForm((prev) => !prev)}
              className="bg-accent hover:bg-accent-hover text-white px-3.5 py-2 rounded-md text-sm font-medium"
            >
              {showForm ? "Yopish" : "+ Yangi murojaat"}
            </button>
          }
        />

        {showForm && (
          <div className={`rounded-2xl border p-4 mb-5 ${theme.rowBorder}`}>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                name="subject"
                value={form.subject}
                onChange={handleFormChange}
                placeholder="Mavzu"
                className={`w-full field`}
              />
              <select
                name="priority"
                value={form.priority}
                onChange={handleFormChange}
                className={`w-full field`}
              >
                <option value="LOW">Past</option>
                <option value="NORMAL">O'rtacha</option>
                <option value="HIGH">Yuqori</option>
                <option value="URGENT">Shoshilinch</option>
              </select>
              <input
                type="text"
                name="contactPhone"
                value={form.contactPhone}
                onChange={handleFormChange}
                placeholder="Aloqa telefoni (ixtiyoriy)"
                className={`w-full field`}
              />
              {canManage && organizations.length > 0 && (
                <select
                  name="organizationId"
                  value={form.organizationId}
                  onChange={handleFormChange}
                  className={`w-full field`}
                >
                  <option value="">Tashkilot tanlanmagan</option>
                  {organizations.map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name}
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
              placeholder="Murojaat matni"
              className={`w-full rounded-xl border px-4 py-3 mt-3 outline-none resize-none ${theme.input}`}
            />

            <div className="flex justify-end mt-3">
              <button
                type="button"
                onClick={handleCreate}
                disabled={saving}
                className="px-3.5 py-2 rounded-md bg-accent hover:bg-accent-hover text-white text-sm font-medium disabled:opacity-60"
              >
                {saving ? "Yuborilmoqda..." : "Yuborish"}
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-5">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              className={`px-3 py-1.5 rounded-md border text-sm ${
                statusFilter === filter.value ? theme.tabActive : theme.tab
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-danger mb-4">{error}</p>}

        {loading ? (
          <p className={`text-sm ${theme.soft}`}>Yuklanmoqda...</p>
        ) : tickets.length === 0 ? (
          <p className={`text-sm ${theme.soft}`}>Murojaat topilmadi</p>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className={`rounded-2xl border p-4 ${theme.rowBorder}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => openTicket(ticket)}
                    className="min-w-0 text-left flex-1"
                  >
                    <p className={`font-semibold ${theme.text}`}>
                      {ticket.subject}
                    </p>
                    <p className={`text-sm mt-1 line-clamp-2 ${theme.soft}`}>
                      {ticket.message}
                    </p>
                    <p className={`text-xs mt-2 ${theme.soft}`}>
                      {ticket.createdByName || "Noma'lum"} (
                      {ROLE_LABELS[ticket.createdByRole] ||
                        ticket.createdByRole}
                      )
                      {ticket.organization?.name
                        ? ` · ${ticket.organization.name}`
                        : ""}{" "}
                      · {formatUzDateTime(ticket.created_at)} ·{" "}
                      {ticket._count?.messages || 0} xabar
                    </p>
                  </button>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-md ${statusTone(
                        ticket.status,
                      )}`}
                    >
                      {STATUS_LABELS[ticket.status] || ticket.status}
                    </span>
                    <span className={`text-xs ${theme.soft}`}>
                      {PRIORITY_LABELS[ticket.priority] || ticket.priority}
                    </span>
                  </div>
                </div>

                {canManage && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {ticket.status !== "IN_PROGRESS" && (
                      <button
                        type="button"
                        onClick={() =>
                          handleStatusChange(ticket, "IN_PROGRESS")
                        }
                        className={`px-3 py-1.5 rounded-md border text-sm ${theme.rowBorder} ${theme.hover} ${theme.text}`}
                      >
                        Ko'rilmoqda
                      </button>
                    )}
                    {ticket.status !== "CLOSED" && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(ticket, "CLOSED")}
                        className={`px-3 py-1.5 rounded-md border text-sm ${theme.rowBorder} ${theme.hover} ${theme.text}`}
                      >
                        Yopish
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(ticket)}
                      className={`px-3 py-1.5 rounded-md border text-sm border-line hover:bg-danger-soft text-fg-muted`}
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {(selectedTicket || ticketLoading) && (
        <div className={`fixed inset-0 z-50 ${theme.overlay}`}>
          <div
            className="absolute inset-0"
            onClick={() => setSelectedTicket(null)}
          />

          <div
            className={`absolute inset-y-0 right-0 w-full sm:max-w-[520px] shadow-2xl overflow-y-auto z-10 flex flex-col bg-surface`}
          >
            <div
              className={`p-4 sm:p-6 flex items-start justify-between gap-3 border-b border-line`}
            >
              <div className="min-w-0">
                <h2 className={`text-lg font-bold break-words ${theme.text}`}>
                  {selectedTicket?.subject || "Yuklanmoqda..."}
                </h2>
                {selectedTicket && (
                  <p className={`text-xs mt-1 ${theme.soft}`}>
                    {STATUS_LABELS[selectedTicket.status]} ·{" "}
                    {PRIORITY_LABELS[selectedTicket.priority]} ·{" "}
                    {formatUzDateTime(selectedTicket.created_at)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className={`text-xl shrink-0 ${theme.soft}`}
              >
                ×
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-3 flex-1">
              {ticketLoading ? (
                <p className={`text-sm ${theme.soft}`}>Yuklanmoqda...</p>
              ) : (
                (selectedTicket?.messages || []).map((message) => (
                  <div
                    key={message.id}
                    className={`rounded-2xl border p-3 ${theme.rowBorder}`}
                  >
                    <p className={`text-xs ${theme.soft}`}>
                      {message.senderName || "Noma'lum"} (
                      {ROLE_LABELS[message.senderRole] || message.senderRole}) ·{" "}
                      {formatUzDateTime(message.created_at)}
                    </p>
                    <p className={`text-sm mt-2 whitespace-pre-wrap ${theme.text}`}>
                      {message.message}
                    </p>
                  </div>
                ))
              )}
            </div>

            {selectedTicket && (
              <div
                className={`p-4 sm:p-6 border-t space-y-3 border-line`}
              >
                <textarea
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  rows={3}
                  placeholder="Javob yozing..."
                  className={`w-full field resize-none`}
                />
                <button
                  type="button"
                  onClick={handleReply}
                  disabled={replying || !replyText.trim()}
                  className="w-full px-3.5 py-2 rounded-md bg-accent hover:bg-accent-hover text-white font-medium disabled:opacity-60"
                >
                  {replying ? "Yuborilmoqda..." : "Javob yuborish"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
