import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  homeworkApi,
  homeworkResponseApi,
  homeworkResultsApi,
} from "../../api/crmApi";
import { formatUzDateTime } from "../../utils/date";

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
  const [savingStudentId, setSavingStudentId] = useState(null);
  const [scoreByStudent, setScoreByStudent] = useState({});
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [responseDetail, setResponseDetail] = useState(null);
  const [responseLoading, setResponseLoading] = useState(false);
  const [responseError, setResponseError] = useState("");
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
      id: row?.id || row?.student?.id || `${backendStatus}-${index}`,
      studentId: row?.student?.id || row?.studentId || row?.id,
      resultId: backendStatus === "PENDING" ? null : row?.id,
      name: row?.student?.fullName || row?.fullName || "-",
      sentAt: row?.created_at || null,
      score: typeof row?.score === "number" ? row.score : null,
      title: row?.title || homeworkData?.title || "Uyga vazifa",
    }));
  }, [tab, statusRows, homeworkData?.title]);

  const closeResponseModal = () => {
    setSelectedStudent(null);
    setResponseDetail(null);
    setResponseError("");
  };

  const handleOpenResponse = async (student) => {
    if (tab === "bajarilmagan") return;

    const homeworkIdNumber = Number(homeworkData?.id);
    const studentIdNumber = Number(student?.studentId);

    if (!homeworkIdNumber || !studentIdNumber) {
      alert("Topshiriqni ochish uchun ma'lumot yetarli emas");
      return;
    }

    try {
      setSelectedStudent(student);
      setResponseLoading(true);
      setResponseError("");
      setResponseDetail(null);

      const response = await homeworkResponseApi.getByStudent(
        homeworkIdNumber,
        studentIdNumber,
      );
      setResponseDetail(response?.data || null);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        "Student yuborgan vazifa topilmadi yoki ochib bo'lmadi";
      setResponseError(Array.isArray(message) ? message.join("\n") : message);
    } finally {
      setResponseLoading(false);
    }
  };

  useEffect(() => {
    setScoreByStudent((prev) => {
      const next = { ...prev };
      mappedStudents.forEach((student) => {
        if (
          typeof student.score === "number" &&
          next[student.studentId] === undefined
        ) {
          next[student.studentId] = String(student.score);
        }
      });
      return next;
    });
  }, [mappedStudents]);

  const formatDateTime = (value) => {
    return formatUzDateTime(value, {
      month: "short",
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

  const handleScoreChange = (studentId, value) => {
    if (value === "") {
      setScoreByStudent((prev) => ({ ...prev, [studentId]: "" }));
      return;
    }

    if (!/^\d{0,3}$/.test(value)) return;

    const numericValue = Number(value);
    if (numericValue > 100) return;

    setScoreByStudent((prev) => ({ ...prev, [studentId]: value }));
  };

  const submitScore = async (student) => {
    const rawScore = scoreByStudent[student.studentId];
    const parsedScore = Number(rawScore);

    if (
      rawScore === undefined ||
      rawScore === "" ||
      Number.isNaN(parsedScore) ||
      parsedScore < 0 ||
      parsedScore > 100
    ) {
      alert("Ball 0 dan 100 gacha bo'lishi kerak");
      return;
    }

    const homeworkIdNumber = Number(homeworkData?.id);
    if (!homeworkIdNumber || !student.studentId) {
      alert("Baholash uchun ma'lumot yetarli emas");
      return;
    }

    const payload = {
      title: student.title || homeworkData?.title || "Uyga vazifa",
      homeworkId: homeworkIdNumber,
      studentId: Number(student.studentId),
      score: parsedScore,
    };

    try {
      setSavingStudentId(student.studentId);

      if (student.resultId) {
        await homeworkResultsApi.update(student.resultId, payload);
      } else {
        await homeworkResultsApi.create(payload);
      }

      const statuses = await homeworkApi.getStatuses(homeworkIdNumber);
      setStatusRows({
        PENDING: Array.isArray(statuses.PENDING) ? statuses.PENDING : [],
        REJECTED: Array.isArray(statuses.REJECTED) ? statuses.REJECTED : [],
        APPROVED: Array.isArray(statuses.APPROVED) ? statuses.APPROVED : [],
        NOT_REVIEWED: Array.isArray(statuses.NOT_REVIEWED)
          ? statuses.NOT_REVIEWED
          : [],
      });
    } catch (error) {
      const message =
        error?.response?.data?.message || "Baholashda xatolik yuz berdi";
      alert(Array.isArray(message) ? message.join("\n") : message);
    } finally {
      setSavingStudentId(null);
    }
  };

  const showGradingActions = tab !== "bajarilmagan";

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
          <div
            className={`grid py-2 border-b text-sm text-slate-500 font-medium ${
              showGradingActions ? "grid-cols-3" : "grid-cols-2"
            }`}
          >
            <div>O&apos;quvchi ismi</div>
            <div>Uyga vazifa jo&apos;natilgan vaqt</div>
            {showGradingActions && <div>Baholash (0-100)</div>}
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
              className={`grid py-3 border-b text-sm hover:bg-slate-50 ${
                showGradingActions ? "grid-cols-3" : "grid-cols-2"
              }`}
            >
              <div>
                <button
                  type="button"
                  onClick={() => handleOpenResponse(student)}
                  disabled={tab === "bajarilmagan"}
                  className={`text-left font-medium ${
                    tab === "bajarilmagan"
                      ? "text-slate-700 cursor-default"
                      : "text-emerald-700 hover:text-emerald-800 underline"
                  }`}
                >
                  {student.name}
                </button>
              </div>
              <div className="text-slate-700">
                {formatDateTime(student.sentAt)}
              </div>

              {showGradingActions && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={scoreByStudent[student.studentId] ?? ""}
                    onChange={(e) =>
                      handleScoreChange(student.studentId, e.target.value)
                    }
                    className="w-24 border border-slate-300 rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500"
                    placeholder="0-100"
                  />
                  <button
                    type="button"
                    onClick={() => submitScore(student)}
                    disabled={savingStudentId === student.studentId}
                    className="px-3 py-1.5 rounded-md bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-60"
                  >
                    {savingStudentId === student.studentId
                      ? "Saqlanmoqda..."
                      : "Baholash"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                Student yuborgan vazifa
              </h3>
              <button
                type="button"
                onClick={closeResponseModal}
                className="text-slate-500 hover:text-slate-700 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-500">O'quvchi</p>
                  <p className="text-slate-900 font-medium mt-1">
                    {selectedStudent.name}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Yuborilgan vaqt</p>
                  <p className="text-slate-900 font-medium mt-1">
                    {formatDateTime(selectedStudent.sentAt)}
                  </p>
                </div>
              </div>

              {responseLoading && (
                <div className="text-sm text-slate-500">Yuklanmoqda...</div>
              )}

              {!responseLoading && responseError && (
                <div className="text-sm text-red-600 whitespace-pre-line">
                  {responseError}
                </div>
              )}

              {!responseLoading && !responseError && responseDetail && (
                <>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">
                      Student yuborgan matn
                    </p>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 whitespace-pre-wrap">
                      {responseDetail.title || "Matn kiritilmagan"}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500 mb-1">
                      Biriktirilgan fayl
                    </p>
                    {responseDetail.file ? (
                      <a
                        href={responseDetail.file}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      >
                        Faylni ochish
                      </a>
                    ) : (
                      <p className="text-sm text-slate-500">
                        Fayl biriktirilmagan
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
