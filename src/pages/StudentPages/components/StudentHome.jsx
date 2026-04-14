export default function StudentHome({
  monthLabel,
  weekDays,
  calendarCells,
  onSelectDate,
  onChangeMonth,
  lessonTitle,
  selectedLessons,
  isLoading,
  darkMode = false,
}) {
  const homeVars = darkMode
    ? {
        "--bg": "#0f172a",
        "--card-bg": "#111827",
        "--text": "#f8fafc",
        "--text-muted": "#94a3b8",
        "--border": "#334155",
        "--accent": "#a78bfa",
        "--accent2": "#8b5cf6",
        "--green": "#34d399",
        "--green-light": "#052e2b",
        "--red": "#f87171",
      }
    : {
        "--bg": "#f4f6f9",
        "--card-bg": "#ffffff",
        "--text": "#1a1d23",
        "--text-muted": "#7a8494",
        "--border": "#e8ecf2",
        "--accent": "#e07b2b",
        "--accent2": "#f5a623",
        "--green": "#22c55e",
        "--green-light": "#dcfce7",
        "--red": "#ef4444",
      };

  return (
    <div className="page active" id="page-home" style={homeVars}>
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
