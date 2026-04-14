export default function StudentGroupDetails({
  groupName,
  lessons,
  isLoading,
  error,
  homeworkFilter,
  onFilterChange,
  onBack,
  onSelectLesson,
  getStatusLabel,
  getStatusTone,
  formatDate,
  getDeadline,
}) {
  return (
    <div className="page active" id="page-group-details">
      <div className="group-details-head">
        <button type="button" className="back-link" onClick={onBack}>
          ← Guruhlar ro'yxatiga qaytish
        </button>
        <div className="section-title">{groupName}</div>
      </div>
      <div className="filter-row">
        <label htmlFor="homework-filter" className="modal-label">
          Uy vazifa statusi
        </label>
        <select
          id="homework-filter"
          className="filter-select"
          value={homeworkFilter}
          onChange={(event) => onFilterChange(event.target.value)}
        >
          <option value="ALL">Barchasi</option>
          <option value="APPROVED">Qabul qilingan</option>
          <option value="NOT_ASSIGNED">Berilmagan</option>
          <option value="REJECTED">Qaytarilgan</option>
          <option value="NOT_DONE">Bajarilmagan</option>
          <option value="PENDING">Kutayotganlar</option>
        </select>
      </div>
      <div className="card card-table">
        <table className="lesson-table">
          <thead>
            <tr>
              <th>Mavzular</th>
              <th>Video</th>
              <th>Uyga vazifa holati</th>
              <th>Uyga vazifa tugash vaqti</th>
              <th>Dars sanasi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="5" className="table-empty">
                  Yuklanmoqda...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="5" className="table-empty">
                  {error}
                </td>
              </tr>
            ) : lessons.length === 0 ? (
              <tr>
                <td colSpan="5" className="table-empty">
                  Darslar topilmadi
                </td>
              </tr>
            ) : (
              lessons.map((item) => (
                <tr
                  key={item.lesson.id}
                  className="clickable-row"
                  onClick={() => onSelectLesson(item)}
                >
                  <td>{item.lesson.title || "-"}</td>
                  <td>
                    <span className="video-badge">{item.videoCount}</span>
                  </td>
                  <td>
                    <span
                      className={`status-pill ${getStatusTone(item.status)}`}
                    >
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                  <td>{getDeadline(item.homework)}</td>
                  <td>{formatDate(item.lessonDate)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
