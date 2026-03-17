import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { homeworkApi } from "../api/crmApi";

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
      sentAt: row?.created_at || "-",
    }));
  }, [tab, statusRows]);

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
    <div className="p-6 bg-gray-50 min-h-screen">
      <div onClick={handleBack} className="mb-4 text-gray-600 cursor-pointer">
        ← Orqaga
      </div>

      <h2 className="text-2xl font-bold">{homeworkData.title}</h2>

      <div className="flex gap-20 mt-4 text-sm text-gray-600">
        <div>
          <p>Mavzu</p>
          <p className="font-semibold text-black">{homeworkData.title}</p>
        </div>

        <div>
          <p>Tugash vaqti</p>
          <p className="font-semibold text-black">{homeworkData.deadline}</p>
        </div>
      </div>

      <div className="flex gap-8 mt-8 border-b">
        <button
          onClick={() => setTab("kutayotgan")}
          className={`pb-3 ${tab === "kutayotgan" && "border-b-2 border-emerald-500 text-emerald-600"}`}
        >
          Kutayotganlar
          <span className="ml-2 bg-yellow-400 text-white text-xs px-2 rounded-full">
            {count("kutayotgan")}
          </span>
        </button>

        <button
          onClick={() => setTab("qaytarilgan")}
          className={`pb-3 ${tab === "qaytarilgan" && "border-b-2 border-emerald-500 text-emerald-600"}`}
        >
          Qaytarilganlar
        </button>

        <button
          onClick={() => setTab("qabul")}
          className={`pb-3 ${tab === "qabul" && "border-b-2 border-emerald-500 text-emerald-600"}`}
        >
          Qabul qilinganlar
        </button>

        <button
          onClick={() => setTab("bajarilmagan")}
          className={`pb-3 ${tab === "bajarilmagan" && "border-b-2 border-emerald-500 text-emerald-600"}`}
        >
          Bajarilmagan
          <span className="ml-2 bg-yellow-400 text-white text-xs px-2 rounded-full">
            {count("bajarilmagan")}
          </span>
        </button>
      </div>

      <div className="mt-6 bg-white rounded-xl shadow">
        <div className="grid grid-cols-2 px-6 py-4 border-b text-sm text-gray-500 font-medium">
          <div>O'quvchi ismi</div>
          <div>Uyga vazifa jo'natilgan vaqt</div>
        </div>

        {loading && (
          <div className="px-6 py-4 border-b text-sm text-gray-500">
            Yuklanmoqda...
          </div>
        )}

        {!loading && mappedStudents.length === 0 && (
          <div className="px-6 py-4 border-b text-sm text-gray-500">
            Ma&apos;lumot topilmadi
          </div>
        )}

        {mappedStudents.map((student) => (
          <div
            key={student.id}
            className="grid grid-cols-2 px-6 py-4 border-b text-sm hover:bg-gray-50"
          >
            <div>{student.name}</div>
            <div>{student.sentAt || "-"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
