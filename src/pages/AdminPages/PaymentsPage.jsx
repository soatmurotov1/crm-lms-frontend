import { useEffect, useMemo, useState } from "react";
import { paymentsApi } from "../../api/crmApi";

const STATUS_LABELS = {
  DEBT: "Qarz",
  PENDING: "Kutilmoqda",
  PAID: "Qabul qilingan",
  CANCELED: "Bekor qilingan",
};

const STATUS_STYLES = {
  DEBT: "bg-danger-soft text-danger",
  PENDING: "bg-warning-soft text-warning",
  PAID: "bg-success-soft text-success",
  CANCELED: "bg-surface-3 text-fg-muted",
};

/** Joriy oy xulosasi uchun kartalar — yorug' va tungi rejim ranglari. */
const SUMMARY_TILES = [
  {
    key: "paid",
    label: "To'langan",
    lightTile: "bg-success-soft",
    darkTile: "bg-success-soft border border-success-border",
    lightValue: "text-success",
    darkValue: "text-success",
  },
  {
    key: "pending",
    label: "Kutilmoqda",
    lightTile: "bg-warning-soft",
    darkTile: "bg-warning-soft border border-warning-border",
    lightValue: "text-warning",
    darkValue: "text-warning",
  },
  {
    key: "debt",
    label: "Qoldiq",
    lightTile: "bg-danger-soft",
    darkTile: "bg-danger-soft border border-danger-border",
    lightValue: "text-danger",
    darkValue: "text-danger",
  },
];

export default function PaymentsPage({ theme, darkMode }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [summary, setSummary] = useState({ paid: 0, pending: 0, debt: 0 });
  const [openMenuId, setOpenMenuId] = useState(null);

  const now = useMemo(() => new Date(), []);

  const formatAmount = (value) =>
    `${new Intl.NumberFormat("uz-UZ").format(Number(value || 0))} so'm`;

  const formatDateTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("uz-UZ");
  };

  const loadSummary = async () => {
    try {
      const result = await paymentsApi.getMonthlySummary({
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      });
      const payload = result?.data ?? result ?? {};
      setSummary({
        paid: payload?.paid || 0,
        pending: payload?.pending || 0,
        debt: payload?.debt || 0,
      });
    } catch {
      setSummary({ paid: 0, pending: 0, debt: 0 });
    }
  };

  const loadPayments = async (nextStatus = statusFilter) => {
    try {
      setLoading(true);
      const result = await paymentsApi.getMonthlyList({
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        status: nextStatus === "ALL" ? undefined : nextStatus,
      });
      const list = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : [];
      setPayments(list);
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
    loadPayments("ALL");
  }, []);

  const handleStartPayment = async (item) => {
    if (!item?.studentId || !item?.groupId) return;
    setActionLoading(`start-${item.studentId}-${item.groupId}`);
    try {
      const result = await paymentsApi.startStudentPayment(item.studentId, {
        groupId: item.groupId,
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      });
      if (result?.paymentUrl) {
        window.open(result.paymentUrl, "_blank", "noopener,noreferrer");
      }
      await loadSummary();
      await loadPayments();
    } catch (apiError) {
      alert(apiError?.response?.data?.message || "To'lovni boshlashda xato");
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkPaid = async (item) => {
    if (!item?.paymentId) return;
    setActionLoading(`paid-${item.paymentId}`);
    try {
      await paymentsApi.markPaid(item.paymentId, { method: "MANUAL" });
      await loadSummary();
      await loadPayments();
    } catch (apiError) {
      alert(apiError?.response?.data?.message || "To'lovni tasdiqlashda xato");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelPayment = async (item) => {
    if (!item?.paymentId) {
      alert("Avval to'lovni boshlang");
      return;
    }
    setActionLoading(`cancel-${item.paymentId}`);
    try {
      await paymentsApi.updateStatus(item.paymentId, { status: "CANCELED" });
      await loadSummary();
      await loadPayments();
    } catch (apiError) {
      alert(
        apiError?.response?.data?.message || "To'lovni bekor qilishda xato",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptPayment = async (item) => {
    if (!item?.paymentId) {
      alert("Avval to'lovni boshlang");
      return;
    }
    setActionLoading(`accept-${item.paymentId}`);
    try {
      await paymentsApi.updateStatus(item.paymentId, { status: "PAID" });
      await loadSummary();
      await loadPayments();
    } catch (apiError) {
      alert(
        apiError?.response?.data?.message || "To'lovni qabul qilishda xato",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return payments;
    return payments.filter((item) =>
      [
        item.studentName,
        item.courseName,
        item.groupName,
        String(item.amount || ""),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [payments, search]);

  return (
    <div className="space-y-5 min-w-0">
      <div className={`${theme.card} border rounded-2xl p-6 shadow-sm`}>
        <h2 className={`text-2xl font-semibold mb-4 ${theme.text}`}>
          Joriy oy uchun to'lovlar
        </h2>

        {/*
          Tungi rejimda och (50) fonlar deyarli oq bo'lib ko'rinadi, shuning
          uchun qorong'i variantlari alohida beriladi.
        */}
        <div className="grid md:grid-cols-3 gap-4">
          {SUMMARY_TILES.map((tile) => (
            <div
              key={tile.key}
              className={`rounded-2xl p-5 ${
                darkMode ? tile.darkTile : tile.lightTile
              }`}
            >
              <p className={`mb-2 ${theme.soft}`}>{tile.label}</p>
              <h3
                className={`text-2xl font-bold ${
                  darkMode ? tile.darkValue : tile.lightValue
                }`}
              >
                {formatAmount(summary[tile.key])}
              </h3>
            </div>
          ))}
        </div>
      </div>

      <div className={`${theme.card} border rounded-2xl p-6 shadow-sm`}>
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-5">
          <div>
            <h3 className={`text-xl font-semibold ${theme.text}`}>
              To'lovlar ro'yxati
            </h3>
            <p className={theme.soft}>
              Talaba, kurs, summa, status va vaqt bo'yicha
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Talaba, kurs yoki guruh"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full sm:w-60 field`}
            />
            <select
              value={statusFilter}
              onChange={(e) => {
                const next = e.target.value;
                setStatusFilter(next);
                loadPayments(next);
              }}
              className={`w-full sm:w-50 field`}
            >
              <option value="ALL">Barchasi</option>
              <option value="PAID">Qabul qilingan</option>
              <option value="PENDING">Kutilmoqda</option>
              <option value="DEBT">Qarz</option>
              <option value="CANCELED">Bekor qilingan</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead className={"bg-surface-2"}>
              <tr>
                <th className={`text-left px-4 py-3 ${theme.text}`}>Talaba</th>
                <th className={`text-left px-4 py-3 ${theme.text}`}>Kurs</th>
                <th className={`text-left px-4 py-3 ${theme.text}`}>Summa</th>
                <th className={`text-left px-4 py-3 ${theme.text}`}>Status</th>
                <th className={`text-left px-4 py-3 ${theme.text}`}>Vaqt</th>
                <th className={`text-left px-4 py-3 ${theme.text}`}>Amal</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className={`px-4 py-4 ${theme.soft}`} colSpan={6}>
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td className={`px-4 py-4 ${theme.soft}`} colSpan={6}>
                    To'lovlar topilmadi
                  </td>
                </tr>
              ) : (
                filteredPayments.map((item) => {
                  const statusLabel = STATUS_LABELS[item.status] || item.status;
                  const statusClass =
                    STATUS_STYLES[item.status] || "bg-surface-2 text-fg-muted";
                  const isStarting =
                    actionLoading === `start-${item.studentId}-${item.groupId}`;
                  const isMarking = actionLoading === `paid-${item.paymentId}`;
                  const isCanceling =
                    actionLoading === `cancel-${item.paymentId}`;
                  const isAccepting =
                    actionLoading === `accept-${item.paymentId}`;
                  const showMinutesLeft =
                    item.status === "PENDING" &&
                    Number.isFinite(Number(item.minutesLeft));

                  return (
                    <tr
                      key={`${item.studentId}-${item.groupId}`}
                      className={`border-t ${theme.rowBorder}`}
                    >
                      <td className={`px-4 py-4 ${theme.text}`}>
                        <div className="font-semibold">{item.studentName}</div>
                        <div className={theme.soft}>{item.groupName}</div>
                      </td>
                      <td className={`px-4 py-4 ${theme.text}`}>
                        {item.courseName}
                      </td>
                      <td className={`px-4 py-4 ${theme.text}`}>
                        {formatAmount(item.amount)}
                      </td>
                      <td className={`px-4 py-4 ${theme.text}`}>
                        <span
                          className={`px-2 py-0.5 rounded-md text-xs font-semibold ${statusClass}`}
                        >
                          {statusLabel}
                        </span>
                        {showMinutesLeft && (
                          <div className={theme.soft}>
                            {item.minutesLeft} daqiqa qoldi
                          </div>
                        )}
                      </td>
                      <td className={`px-4 py-4 ${theme.text}`}>
                        {item.status === "PAID"
                          ? formatDateTime(item.paidAt)
                          : formatDateTime(item.createdAt)}
                      </td>
                      <td className="px-4 py-4 relative">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenuId((prev) =>
                              prev ===
                              (item.paymentId ||
                                `${item.studentId}-${item.groupId}`)
                                ? null
                                : item.paymentId ||
                                  `${item.studentId}-${item.groupId}`,
                            )
                          }
                          className={`px-3 py-2 text-xs rounded-lg border ${
                            darkMode
                              ? "border-line-strong text-fg-muted hover:bg-surface-2"
                              : "border-line text-fg-muted hover:bg-surface-2"
                          }`}
                        >
                          ...
                        </button>

                        {openMenuId ===
                          (item.paymentId ||
                            `${item.studentId}-${item.groupId}`) && (
                          <div
                            className={`absolute right-0 mt-2 w-48 rounded-xl border shadow-lg z-10 bg-surface border-line`}
                          >
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                handleStartPayment(item);
                              }}
                              disabled={isStarting}
                              className={`w-full text-left px-4 py-2 text-sm text-fg-muted hover:bg-surface-2 disabled:opacity-60`}
                            >
                              {isStarting ? "..." : "To'lovni boshlash"}
                            </button>
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                handleMarkPaid(item);
                              }}
                              disabled={isMarking}
                              className={`w-full text-left px-4 py-2 text-sm text-fg-muted hover:bg-surface-2 disabled:opacity-60`}
                            >
                              {isMarking ? "..." : "Tasdiqlash"}
                            </button>
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                handleCancelPayment(item);
                              }}
                              disabled={isCanceling}
                              className={`w-full text-left px-4 py-2 text-sm text-fg-muted hover:bg-surface-2 disabled:opacity-60`}
                            >
                              {isCanceling ? "..." : "Bekor qilish"}
                            </button>
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                handleAcceptPayment(item);
                              }}
                              disabled={isAccepting}
                              className={`w-full text-left px-4 py-2 text-sm text-fg-muted hover:bg-surface-2 disabled:opacity-60`}
                            >
                              {isAccepting ? "..." : "Qabul qilingan"}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
