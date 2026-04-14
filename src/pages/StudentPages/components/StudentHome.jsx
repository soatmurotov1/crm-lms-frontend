export default function StudentHome({
  monthLabel,
  weekDays,
  calendarCells,
  onSelectDate,
  onChangeMonth,
  lessonTitle,
  selectedLessons,
  isLoading,
}) {
  return (
    <div className="page active" id="page-home">
      <div className="calendar-section">
        <div className="card">
          <div className="section-title">Dars jadvali</div>
          <div className="cal-header">
            <span className="cal-month">{monthLabel}</span>
            <div className="cal-nav">
              <button type="button" onClick={() => onChangeMonth(-1)}>
                &#8249;
              </button>
              <button type="button" onClick={() => onChangeMonth(1)}>
                &#8250;
              </button>
            </div>
          </div>
          <div className="cal-grid">
            {weekDays.map((day) => (
              <div key={day} className="cal-dow">
                {day}
              </div>
            ))}
            {calendarCells.map((cell) =>
              cell.isEmpty ? (
                <div key={cell.key} className="cal-day empty" />
              ) : (
                <button
                  type="button"
                  key={cell.key}
                  className={cell.className}
                  onClick={() => onSelectDate(cell.date)}
                >
                  {cell.label}
                </button>
              ),
            )}
          </div>
        </div>
        <div className="card">
          <div className="section-title">{lessonTitle}</div>
          {isLoading ? (
            <div className="no-lesson">Yuklanmoqda...</div>
          ) : selectedLessons.length === 0 ? (
            <div className="no-lesson">Tanlangan kunda darslar yo'q</div>
          ) : (
            selectedLessons.map((lesson) => (
              <div key={lesson.id} className="lesson-card">
                <div className="lesson-title">{lesson.title}</div>
                <div className="lesson-time">
                  <span>{lesson.time}</span>
                  <span>•</span>
                  <span>{lesson.room}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
