import { useRef } from "react";
import Icon from "../../../components/ui/Icon";

export default function StudentLessonDetail({
  groupName,
  lessonItem,
  videos,
  homework,
  response,
  result,
  status,
  isSubmissionExpired,
  isLoading,
  error,
  note,
  selectedFile,
  submitError,
  submitting,
  exam,
  examResponse,
  isExamSubmissionExpired,
  examNote,
  examFile,
  examSubmitError,
  examSubmitting,
  onBack,
  onNoteChange,
  onFileChange,
  onSubmit,
  onExamNoteChange,
  onExamFileChange,
  onExamSubmit,
  getStatusLabel,
  getStatusTone,
  formatDate,
  formatDateTime,
  getDeadline,
  getVideoName,
}) {
  const lessonTitle = lessonItem?.lesson?.title || "-";
  const lessonDate = lessonItem?.lessonDate;
  const canSubmit = Boolean(homework) && !response && !isSubmissionExpired;
  const canSubmitExam = Boolean(exam) && !isExamSubmissionExpired;
  const statusTone = getStatusTone(status);
  const statusLabel = getStatusLabel(status);
  const fileInputRef = useRef(null);
  const examFileInputRef = useRef(null);

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleExamAttachClick = () => {
    examFileInputRef.current?.click();
  };

  return (
    <div className="page active" id="page-lesson-detail">
      <div className="group-details-head">
        <button type="button" className="back-link" onClick={onBack}>
          <Icon name="arrowLeft" size={15} className="inline align-[-0.1875em]" /> Darslar ro'yxatiga qaytish
        </button>
        <div className="section-title">{groupName}</div>
      </div>

      <div className="lesson-detail-header">
        <div>
          <div className="lesson-detail-title">{lessonTitle}</div>
          <div className="lesson-detail-sub">
            Dars sanasi: {formatDate(lessonDate)}
          </div>
        </div>
        <span className={`status-pill ${statusTone}`}>{statusLabel}</span>
      </div>

      {isLoading ? (
        <div className="card lesson-detail-card">Yuklanmoqda...</div>
      ) : error ? (
        <div className="card lesson-detail-card">{error}</div>
      ) : (
        <div className="lesson-detail-grid">
          <div className="lesson-detail-main">
            <div className="card lesson-detail-card">
              <div className="section-title">Video</div>
              {videos.length === 0 ? (
                <div className="no-lesson">Video topilmadi</div>
              ) : (
                <div className="video-list">
                  {videos.map((video) => (
                    <div key={video.id} className="video-item">
                      <video
                        className="video-player"
                        src={video.file}
                        controls
                      />
                      <div className="video-name">{getVideoName(video)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card lesson-detail-card">
              <div className="section-title">Uyga vazifa</div>
              {!homework ? (
                <div className="no-lesson">Uyga vazifa berilmagan</div>
              ) : (
                <div className="homework-details">
                  <div className="homework-title">{homework.title}</div>
                  {homework.file && (
                    <a
                      className="homework-file"
                      href={homework.file}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Faylni yuklab olish
                    </a>
                  )}
                  <div className="homework-meta">
                    <span>Muddat: {getDeadline(homework)}</span>
                    {result?.score !== undefined && result?.score !== null && (
                      <span>Ball: {result.score}</span>
                    )}
                  </div>
                  {canSubmit ? (
                    <form
                      className="submission-form"
                      onSubmit={(event) => {
                        event.preventDefault();
                        onSubmit();
                      }}
                    >
                      <div className="submission-bar">
                        <input
                          id="homework-note"
                          type="text"
                          className="submission-input"
                          placeholder="Fayl biriktiring va izoh qoldiring"
                          value={note}
                          onChange={(event) => onNoteChange(event.target.value)}
                        />
                        <button
                          type="button"
                          className="attach-btn"
                          onClick={handleAttachClick}
                          aria-label="Fayl biriktirish"
                        >
                          <Icon name="attachment" size={16} />
                        </button>
                        <button
                          type="submit"
                          className="send-btn"
                          aria-label="Yuborish"
                          disabled={submitting}
                        >
                          <Icon name="send" size={16} />
                          {selectedFile ? (
                            <span className="send-btn-badge">1</span>
                          ) : null}
                        </button>
                      </div>
                      <input
                        ref={fileInputRef}
                        id="homework-file"
                        type="file"
                        className="modal-file is-hidden"
                        onChange={(event) =>
                          onFileChange(event.target.files?.[0])
                        }
                      />
                      {submitError && (
                        <div className="modal-error">{submitError}</div>
                      )}
                    </form>
                  ) : response ? (
                    <div className="no-lesson">
                      Uyga vazifa topshirilgan. Qayta topshirish mumkin emas.
                    </div>
                  ) : isSubmissionExpired ? (
                    <div className="no-lesson">
                      Uyga vazifa muddati tugagan. Topshirish mumkin emas.
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <div className="card lesson-detail-card">
              <div className="section-title">Exam</div>
              {!exam ? (
                <div className="no-lesson">Exam topilmadi</div>
              ) : (
                <div className="homework-details">
                  <div className="homework-title">{exam.title}</div>
                  {exam.file && (
                    <a
                      className="homework-file"
                      href={exam.file}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Exam faylini yuklab olish
                    </a>
                  )}
                  <div className="homework-meta">
                    <span>Boshlanish: {formatDateTime(exam.startAt)}</span>
                    <span>Tugash: {formatDateTime(exam.endAt)}</span>
                  </div>
                  {canSubmitExam ? (
                    <form
                      className="submission-form"
                      onSubmit={(event) => {
                        event.preventDefault();
                        onExamSubmit();
                      }}
                    >
                      <div className="submission-bar">
                        <input
                          id="exam-note"
                          type="text"
                          className="submission-input"
                          placeholder="Comment yozing yoki fayl biriktiring"
                          value={examNote}
                          onChange={(event) =>
                            onExamNoteChange(event.target.value)
                          }
                        />
                        <button
                          type="button"
                          className="attach-btn"
                          onClick={handleExamAttachClick}
                          aria-label="Exam faylini biriktirish"
                        >
                          <Icon name="attachment" size={16} />
                        </button>
                        <button
                          type="submit"
                          className="send-btn"
                          aria-label="Yuborish"
                          disabled={examSubmitting}
                        >
                          <Icon name="send" size={16} />
                          {examFile ? (
                            <span className="send-btn-badge">1</span>
                          ) : null}
                        </button>
                      </div>
                      <input
                        ref={examFileInputRef}
                        id="exam-file"
                        type="file"
                        className="modal-file is-hidden"
                        onChange={(event) =>
                          onExamFileChange(event.target.files?.[0])
                        }
                      />
                      {examSubmitError && (
                        <div className="modal-error">{examSubmitError}</div>
                      )}
                    </form>
                  ) : examResponse ? (
                    <div className="no-lesson">
                      Exam topshirilgan. Vaqt ichida tahrirlash mumkin.
                    </div>
                  ) : isExamSubmissionExpired ? (
                    <div className="no-lesson">
                      Exam vaqti tugagan yoki hali boshlanmagan.
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          <div className="lesson-detail-aside">
            <div className="card lesson-detail-card">
              <div className="section-title">Topshiriq holati</div>
              {response ? (
                <div className="submission-info">
                  <div className="submission-row">
                    <span className="info-label">Topshirildi</span>
                    <span className="info-val">
                      {formatDateTime(response.created_at)}
                    </span>
                  </div>
                  <div className="submission-row">
                    <span className="info-label">Izoh</span>
                    <span className="info-val">{response.title}</span>
                  </div>
                  {response.file && (
                    <a
                      className="homework-file"
                      href={response.file}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Yuborilgan fayl
                    </a>
                  )}
                </div>
              ) : (
                <div className="no-lesson">Uyga vazifa hali topshirilmagan</div>
              )}

              {result && (
                <div className="teacher-feedback">
                  <div className="section-sub">O'qituvchi izohi</div>
                  <div className="feedback-text">
                    {result.comment || result.title || "-"}
                  </div>
                  <div className="submission-row">
                    <span className="info-label">Tekshiruvchi</span>
                    <span className="info-val">
                      {result.teacher?.fullName || result.user?.fullName || "-"}
                    </span>
                  </div>
                  <div className="submission-row">
                    <span className="info-label">Ball</span>
                    <span className="info-val">
                      {result.score !== undefined && result.score !== null
                        ? result.score
                        : "-"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="card lesson-detail-card">
              <div className="section-title">Exam holati</div>
              {examResponse ? (
                <div className="submission-info">
                  <div className="submission-row">
                    <span className="info-label">Topshirildi</span>
                    <span className="info-val">
                      {formatDateTime(examResponse.created_at)}
                    </span>
                  </div>
                  <div className="submission-row">
                    <span className="info-label">Comment</span>
                    <span className="info-val">
                      {examResponse.comment || "-"}
                    </span>
                  </div>
                  {examResponse.file && (
                    <a
                      className="homework-file"
                      href={examResponse.file}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Yuborilgan fayl
                    </a>
                  )}
                </div>
              ) : (
                <div className="no-lesson">Exam hali topshirilmagan</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
