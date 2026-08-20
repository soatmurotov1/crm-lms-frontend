import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  homeworkApi,
  homeworkResponseApi,
  homeworkResultsApi,
} from "../../api/crmApi";
import { formatUzDateTime } from "../../utils/date";
import Icon from "../../components/ui/Icon";

const TAB_TO_STATUS = {
  kutayotgan: "PENDING",
  qaytarilgan: "REJECTED",
  qabul: "APPROVED",
  bajarilmagan: "NOT_REVIEWED",
};

const EMPTY_STATUS_ROWS = {
  PENDING: [],
  REJECTED: [],
  APPROVED: [],
  NOT_REVIEWED: [],
};

export default function HomeworkDetailPage({
  homework,
  onBack,
  darkMode = false,
}) {
  const navigate = useNavigate();
  const { homeworkId } = useParams();

  const [tab, setTab] = useState("kutayotgan");
  const [loading, setLoading] = useState(false);
  const [savingStudentId, setSavingStudentId] = useState(null);
  const [scoreByStudent, setScoreByStudent] = useState({});
  const [commentByStudent, setCommentByStudent] = useState({});
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [responseDetail, setResponseDetail] = useState(null);
  const [responseLoading, setResponseLoading] = useState(false);
  const [responseError, setResponseError] = useState("");
  const [statusRows, setStatusRows] = useState(EMPTY_STATUS_ROWS);

  const homeworkData = homework || {
    id: homeworkId,
    title: "Uyga vazifa",
    deadline: "-",
  };

  useEffect(() => {
    const targetId = Number(homeworkData?.id);
    if (!targetId) {
      setStatusRows(EMPTY_STATUS_ROWS);
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
        setStatusRows(EMPTY_STATUS_ROWS);
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
      comment: typeof row?.comment === "string" ? row.comment : "",
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
    setScoreByStudent(() => {
      const next = {};
      mappedStudents.forEach((student) => {
        next[student.studentId] =
          typeof student.score === "number" ? String(student.score) : "";
      });
      return next;
    });
  }, [mappedStudents]);

  useEffect(() => {
    setCommentByStudent(() => {
      const next = {};
      mappedStudents.forEach((student) => {
        next[student.studentId] = student.comment || "";
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

  const handleCommentChange = (studentId, value) => {
    setCommentByStudent((prev) => ({ ...prev, [studentId]: value }));
  };

  const canSubmitScore = (student) => {
    if (!student?.studentId) return false;

    const rawScore = scoreByStudent[student.studentId] ?? "";
    const parsedScore = Number(rawScore);
    const hasValidScore =
      rawScore !== "" &&
      !Number.isNaN(parsedScore) &&
      parsedScore >= 0 &&
      parsedScore <= 100;

    if (!hasValidScore) return false;

    const originalScore =
      typeof student.score === "number" ? String(student.score) : "";
    const originalComment = String(student.comment || "").trim();
    const nextComment = String(
      commentByStudent[student.studentId] || "",
    ).trim();

    const scoreChanged = String(rawScore) !== originalScore;
    const commentChanged = nextComment !== originalComment;

    return scoreChanged || commentChanged;
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
      comment: (commentByStudent[student.studentId] || "").trim() || null,
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

  const pageClass = darkMode
    ? "p-3 sm:p-5 bg-transparent min-h-screen"
    : "p-3 sm:p-5 bg-surface-2 min-h-screen";
  const titleClass = "text-xl sm:text-2xl font-bold text-fg mb-3";
  const backClass = "mb-3 text-fg-muted hover:text-fg-muted text-sm";
  const cardClass = "bg-surface border border-line rounded-xl overflow-hidden";
  const mutedClass = "text-fg-muted";
  const textClass = "text-fg";
  const rowHoverClass = "hover:bg-surface-2";
  const inputClass = darkMode
    ? "w-24 border border-line-strong bg-surface-2 text-fg rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-success-border focus:border-success-border"
    : "w-24 border border-line-strong rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-success-border focus:border-success-border";
  const textareaClass = darkMode
    ? "w-full min-w-45 border border-line-strong bg-surface-2 text-fg rounded-md px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-success-border focus:border-success-border"
    : "w-full min-w-45 border border-line-strong rounded-md px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-success-border focus:border-success-border";

  return (
    <div className={pageClass}>
      <button onClick={handleBack} className={backClass}>
        <Icon name="arrowLeft" size={16} />
      </button>

      <h2 className={titleClass}>{homeworkData.title}</h2>

      <div className={cardClass}>
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 gap-3 px-4 py-3 border-b border-line`}
        >
          <div>
            <p className={`text-xs ${mutedClass}`}>Mavzu</p>
            <p className={`font-semibold mt-1 ${textClass}`}>
              {homeworkData.title}
            </p>
          </div>

          <div>
            <p className={`text-xs ${mutedClass}`}>Tugash vaqti</p>
            <p className={`font-semibold mt-1 ${textClass}`}>
              {homeworkData.deadline}
            </p>
          </div>
        </div>

        <div
          className={`px-4 pt-3 border-b overflow-x-auto border-line`}
        >
          <div className="flex items-center gap-6 min-w-max text-sm">
            <button
              onClick={() => setTab("kutayotgan")}
              className={`pb-3 border-b-2 ${
                tab === "kutayotgan"
                  ? "border-success-border text-success"
                  : "border-transparent text-fg-muted"
              }`}
            >
              Kutayotganlar
              <span className="ml-1.5 bg-warning text-white text-[11px] px-1.5 py-0.5 rounded-sm">
                {count("kutayotgan")}
              </span>
            </button>

            <button
              onClick={() => setTab("qaytarilgan")}
              className={`pb-3 border-b-2 ${
                tab === "qaytarilgan"
                  ? "border-success-border text-success"
                  : "border-transparent text-fg-muted"
              }`}
            >
              Qaytarilganlar
              <span className="ml-1.5 bg-warning text-white text-[11px] px-1.5 py-0.5 rounded-sm">
                {count("qaytarilgan")}
              </span>
            </button>

            <button
              onClick={() => setTab("qabul")}
              className={`pb-3 border-b-2 ${
                tab === "qabul"
                  ? "border-success-border text-success"
                  : "border-transparent text-fg-muted"
              }`}
            >
              Qabul qilinganlar
              <span className="ml-1.5 bg-warning text-white text-[11px] px-1.5 py-0.5 rounded-sm">
                {count("qabul")}
              </span>
            </button>

            <button
              onClick={() => setTab("bajarilmagan")}
              className={`pb-3 border-b-2 ${
                tab === "bajarilmagan"
                  ? "border-success-border text-success"
                  : "border-transparent text-fg-muted"
              }`}
            >
              Bajarilmagan
              <span className="ml-1.5 bg-warning text-white text-[11px] px-1.5 py-0.5 rounded-sm">
                {count("bajarilmagan")}
              </span>
            </button>
          </div>
        </div>

        <div className="px-4 py-3">
          <div
            className={`grid py-2 border-b text-sm ${mutedClass} font-medium ${
              showGradingActions ? "grid-cols-4" : "grid-cols-2"
            } border-line`}
          >
            <div>O&apos;quvchi ismi</div>
            <div>Uyga vazifa jo&apos;natilgan vaqt</div>
            {showGradingActions && <div>Baholash (0-100)</div>}
            {showGradingActions && <div>O&apos;qituvchi izohi</div>}
          </div>

          {loading && (
            <div
              className={`py-3 border-b text-sm ${mutedClass} border-line`}
            >
              Yuklanmoqda...
            </div>
          )}

          {!loading && mappedStudents.length === 0 && (
            <div
              className={`py-3 border-b text-sm ${mutedClass} border-line`}
            >
              Ma&apos;lumot topilmadi
            </div>
          )}

          {mappedStudents.map((student) => (
            <div
              key={student.id}
              className={`grid py-3 border-b text-sm ${rowHoverClass} border-line ${
                showGradingActions ? "grid-cols-4" : "grid-cols-2"
              }`}
            >
              <div>
                <p className={`font-medium ${textClass}`}>{student.name}</p>
                {tab !== "bajarilmagan" && (
                  <button
                    type="button"
                    onClick={() => handleOpenResponse(student)}
                    className="mt-1 text-xs text-success hover:text-success underline"
                  >
                    Topshiriqni ko&apos;rish
                  </button>
                )}
              </div>
              <div className={"text-fg-muted"}>
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
                    className={inputClass}
                    placeholder="0-100"
                  />
                  <button
                    type="button"
                    onClick={() => submitScore(student)}
                    disabled={
                      savingStudentId === student.studentId ||
                      !canSubmitScore(student)
                    }
                    className="px-3 py-1.5 rounded-md bg-accent text-accent-fg hover:bg-accent-hover disabled:opacity-60"
                  >
                    {savingStudentId === student.studentId
                      ? "Saqlanmoqda..."
                      : "Baholash"}
                  </button>
                </div>
              )}

              {showGradingActions && (
                <div>
                  <textarea
                    rows={2}
                    value={commentByStudent[student.studentId] ?? ""}
                    onChange={(e) =>
                      handleCommentChange(student.studentId, e.target.value)
                    }
                    className={textareaClass}
                    placeholder="Izoh yozing"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-overlay flex items-center justify-center p-4">
          <div
            className={`w-full max-w-2xl rounded-2xl shadow-2xl border bg-surface border-line`}
          >
            <div
              className={`flex items-center justify-between px-5 py-4 border-b border-line`}
            >
              <h3 className={`text-lg font-semibold ${textClass}`}>
                Student yuborgan vazifa
              </h3>
              <button
                type="button"
                onClick={closeResponseModal}
                className={`${mutedClass} hover:text-fg-muted text-xl leading-none`}
              >
                ×
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className={mutedClass}>O'quvchi</p>
                  <p className={`${textClass} font-medium mt-1`}>
                    {selectedStudent.name}
                  </p>
                </div>
                <div>
                  <p className={mutedClass}>Yuborilgan vaqt</p>
                  <p className={`${textClass} font-medium mt-1`}>
                    {formatDateTime(selectedStudent.sentAt)}
                  </p>
                </div>
              </div>

              {responseLoading && (
                <div className={`text-sm ${mutedClass}`}>Yuklanmoqda...</div>
              )}

              {!responseLoading && responseError && (
                <div className="text-sm text-danger whitespace-pre-line">
                  {responseError}
                </div>
              )}

              {!responseLoading && !responseError && responseDetail && (
                <>
                  <div>
                    <p className={`text-sm ${mutedClass} mb-1`}>
                      Student yuborgan matn
                    </p>
                    <div
                      className={`rounded-xl border px-3 py-2 whitespace-pre-wrap border-line bg-surface-2 text-fg`}
                    >
                      {responseDetail.title || "Matn kiritilmagan"}
                    </div>
                  </div>

                  <div>
                    <p className={`text-sm ${mutedClass} mb-1`}>
                      Biriktirilgan fayl
                    </p>
                    {responseDetail.file ? (
                      <a
                        href={responseDetail.file}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-success-border bg-success-soft text-success hover:bg-success-soft"
                      >
                        Faylni ochish
                      </a>
                    ) : (
                      <p className={`text-sm ${mutedClass}`}>
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
