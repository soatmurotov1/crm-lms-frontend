import { useRef } from "react";

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
  onBack,
  onNoteChange,
  onFileChange,
  onSubmit,
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
  const statusTone = getStatusTone(status);
  const statusLabel = getStatusLabel(status);
  const fileInputRef = useRef(null);

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="page active" id="page-lesson-detail">
      <div className="group-details-head">
        <button type="button" className="back-link" onClick={onBack}>
          ← Darslar ro'yxatiga qaytish
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
                          📎
                        </button>
                        <button
                          type="submit"
                          className="send-btn"
                          aria-label="Yuborish"
                          disabled={submitting}
                        >
                          ➤
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
          </div>
        </div>
      )}
    </div>
  );
}
