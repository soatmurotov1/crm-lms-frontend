import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { homeworkApi } from "../../api/crmApi";

const TAB_TO_STATUS = {
  kutayotgan: "PENDING",
  qaytarilgan: "REJECTED",
  qabul: "APPROVED",
  bajarilmagan: "NOT_REVIEWED",
};

export default function HomeworkDetailPage({ homework, onBack }) {
  const navigate = useNavigate();
  const { homeworkId } = useParams();

  const [tab, setTab] = useState("kutayotgan");
  const [loading, setLoading] = useState(false);
  const [statusRows, setStatusRows] = useState({
    PENDING: [],
    REJECTED: [],
    APPROVED: [],
    NOT_REVIEWED: [],
  });

  const homeworkData = homework || {
    id: homeworkId,
    title: "Uyga vazifa",
    deadline: "-",
  };

  useEffect(() => {
    const targetId = Number(homeworkData?.id);
    if (!targetId) {
      setStatusRows({
        PENDING: [],
        REJECTED: [],
        APPROVED: [],
        NOT_REVIEWED: [],
      });
      return;
    }

    const loadStatuses = async () => {
      try {
        setLoading(true);
        const statuses = await homeworkApi.getStatuses(targetId);
        setStatusRows({
          PENDING: Array.isArray(statuses.PENDING) ? statuses.PENDING : [],
          REJECTED: Array.isArray(statuses.REJECTED) ? statuses.REJECTED : [],
          APPROVED: Array.isArray(statuses.APPROVED) ? statuses.APPROVED : [],
          NOT_REVIEWED: Array.isArray(statuses.NOT_REVIEWED)
            ? statuses.NOT_REVIEWED
            : [],
        });
      } catch {
        setStatusRows({
          PENDING: [],
          REJECTED: [],
          APPROVED: [],
          NOT_REVIEWED: [],
        });
      } finally {
        setLoading(false);
      }
    };

    loadStatuses();
  }, [homeworkData?.id]);

  const mappedStudents = useMemo(() => {
    const backendStatus = TAB_TO_STATUS[tab];
    const rows = statusRows[backendStatus] || [];

    return rows.map((row, index) => ({
      id: row?.student?.id || row?.id || `${backendStatus}-${index}`,
      name: row?.student?.fullName || row?.fullName || "-",
      sentAt: row?.created_at || null,
    }));
  }, [tab, statusRows]);

  const formatDateTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("uz-UZ", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const count = (statusKey) => {
    const backendStatus = TAB_TO_STATUS[statusKey];
    return (statusRows[backendStatus] || []).length;
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="p-3 sm:p-5 bg-slate-50 min-h-screen">
      <button
        onClick={handleBack}
        className="mb-3 text-slate-500 hover:text-slate-700 text-sm"
      >
        ←
      </button>

      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
        {homeworkData.title}
      </h2>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-4 py-3 border-b border-slate-200">
          <div>
            <p className="text-xs text-slate-500">Mavzu</p>
            <p className="font-semibold text-slate-900 mt-1">
              {homeworkData.title}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Tugash vaqti</p>
            <p className="font-semibold text-slate-900 mt-1">
              {homeworkData.deadline}
            </p>
          </div>
        </div>

        <div className="px-4 pt-3 border-b border-slate-200 overflow-x-auto">
          <div className="flex items-center gap-6 min-w-max text-sm">
            <button
              onClick={() => setTab("kutayotgan")}
              className={`pb-3 border-b-2 ${
                tab === "kutayotgan"
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-slate-600"
              }`}
            >
              Kutayotganlar
              <span className="ml-1.5 bg-amber-400 text-white text-[11px] px-1.5 py-0.5 rounded-full">
                {count("kutayotgan")}
              </span>
            </button>

            <button
              onClick={() => setTab("qaytarilgan")}
              className={`pb-3 border-b-2 ${
                tab === "qaytarilgan"
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-slate-600"
              }`}
            >
              Qaytarilganlar
              <span className="ml-1.5 bg-amber-400 text-white text-[11px] px-1.5 py-0.5 rounded-full">
                {count("qaytarilgan")}
              </span>
            </button>

            <button
              onClick={() => setTab("qabul")}
              className={`pb-3 border-b-2 ${
                tab === "qabul"
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-slate-600"
              }`}
            >
              Qabul qilinganlar
              <span className="ml-1.5 bg-amber-400 text-white text-[11px] px-1.5 py-0.5 rounded-full">
                {count("qabul")}
              </span>
            </button>

            <button
              onClick={() => setTab("bajarilmagan")}
              className={`pb-3 border-b-2 ${
                tab === "bajarilmagan"
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-slate-600"
              }`}
            >
              Bajarilmagan
              <span className="ml-1.5 bg-amber-400 text-white text-[11px] px-1.5 py-0.5 rounded-full">
                {count("bajarilmagan")}
              </span>
            </button>
          </div>
        </div>

        <div className="px-4 py-3">
          <div className="grid grid-cols-2 py-2 border-b text-sm text-slate-500 font-medium">
            <div>O&apos;quvchi ismi</div>
            <div>Uyga vazifa jo&apos;natilgan vaqt</div>
          </div>

          {loading && (
            <div className="py-3 border-b text-sm text-slate-500">
              Yuklanmoqda...
            </div>
          )}

          {!loading && mappedStudents.length === 0 && (
            <div className="py-3 border-b text-sm text-slate-500">
              Ma&apos;lumot topilmadi
            </div>
          )}

          {mappedStudents.map((student) => (
            <div
              key={student.id}
              className="grid grid-cols-2 py-3 border-b text-sm hover:bg-slate-50"
            >
              <div className="text-slate-800">{student.name}</div>
              <div className="text-slate-700">
                {formatDateTime(student.sentAt)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
