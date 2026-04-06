import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const WEEKDAY_LABELS = ["D", "S", "C", "P", "J", "S", "Y"];
const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DAY_KEYS = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

export default function StudentHome({
  groups,
  lessons,
  selectedGroup,
  groupsLoading,
  lessonsLoading,
}) {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [activeMonth, setActiveMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const lessonDaySet = useMemo(() => {
    return new Set(
      Array.isArray(selectedGroup?.weekDays)
        ? selectedGroup.weekDays.map((day) => String(day).toUpperCase())
        : [],
    );
  }, [selectedGroup]);

  const calendarDays = useMemo(() => {
    const year = activeMonth.getFullYear();
    const month = activeMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const offset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];

    for (let i = 0; i < offset; i += 1) {
      cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(new Date(year, month, day));
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    return cells;
  }, [activeMonth]);

  const todayKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  }, []);

  const monthLabel = `${MONTH_LABELS[activeMonth.getMonth()]} ${activeMonth.getFullYear()}`;

  const hasLesson = (date) => {
    if (!date) return false;
    const dayKey = DAY_KEYS[date.getDay()];
    return lessonDaySet.has(dayKey);
  };

  const isToday = (date) => {
    if (!date) return false;
    return (
      `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}` === todayKey
    );
  };

  const changeMonth = (direction) => {
    setActiveMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + direction, 1),
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("crm_access_token");
    navigate("/", { replace: true });
  };

  return (
    <section className="student-page">
      <div className="student-page-header">
        <h1>Bosh sahifa</h1>
        <button
          type="button"
          className="student-header-logout"
          onClick={() => setShowLogoutModal(true)}
        >
          Chiqish
        </button>
      </div>

      <div className="student-grid">
        <div className="student-card student-calendar-card">
          <div className="student-card-title">Dars jadvali</div>
          <div className="student-calendar">
            <div className="student-calendar-header">
              <button
                type="button"
                className="student-calendar-nav"
                onClick={() => changeMonth(-1)}
              >
                ‹
              </button>
              <div className="student-calendar-title">{monthLabel}</div>
              <button
                type="button"
                className="student-calendar-nav"
                onClick={() => changeMonth(1)}
              >
                ›
              </button>
            </div>

            <div className="student-calendar-weekdays">
              {WEEKDAY_LABELS.map((label, index) => (
                <div key={`${label}-${index}`} className="student-weekday">
                  {label}
                </div>
              ))}
            </div>

            <div className="student-calendar-grid">
              {calendarDays.map((date, index) => (
                <div
                  key={`cell-${index}`}
                  className={`student-calendar-cell ${
                    date ? "is-day" : "is-empty"
                  } ${isToday(date) ? "is-today" : ""}`}
                >
                  {date ? (
                    <>
                      <span className="student-calendar-day">
                        {date.getDate()}
                      </span>
                      {hasLesson(date) ? (
                        <span className="student-calendar-dot" />
                      ) : null}
                    </>
                  ) : null}
                </div>
              ))}
            </div>

            {!lessonDaySet.size ? (
              <div className="student-calendar-empty">
                Bu oy uchun dars jadvali topilmadi.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {showLogoutModal ? (
        <div className="student-modal-overlay">
          <div className="student-modal">
            <button
              type="button"
              className="student-modal-close"
              onClick={() => setShowLogoutModal(false)}
              aria-label="Yopish"
            >
              ×
            </button>
            <div className="student-modal-title">
              Platformadan chiqishni xohlaysizmi?
            </div>
            <div className="student-modal-actions">
              <button
                type="button"
                className="student-modal-btn ghost"
                onClick={() => setShowLogoutModal(false)}
              >
                Yo'q
              </button>
              <button
                type="button"
                className="student-modal-btn primary"
                onClick={handleLogout}
              >
                Ha
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
