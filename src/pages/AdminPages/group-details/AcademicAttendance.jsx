import { useEffect, useMemo, useState } from "react";
import { attendanceApi, groupsApi, lessonsApi } from "../../../api/crmApi";

function Toggle({ checked, onChange }) {
  return (
    <label style={styles.toggleLabel}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ display: "none" }}
      />
      <span
        style={{
          ...styles.toggleTrack,
          background: checked ? "#1D9E75" : "#d1d5db",
        }}
      >
        <span
          style={{
            ...styles.toggleThumb,
            transform: checked ? "translateX(18px)" : "translateX(0)",
          }}
        />
      </span>
    </label>
  );
}

function StatusBadge({ came }) {
  return (
    <span
      style={{
        ...styles.badge,
        background: came ? "#E1F5EE" : "#f3f4f6",
        color: came ? "#0F6E56" : "#9ca3af",
      }}
    >
      {came ? "Keldi" : "Kelmadi"}
    </span>
  );
}

export default function Attendance({ groupId, group, groupData }) {
  const resolvedGroupId = groupId ?? group?.id;
  const [mavzu, setMavzu] = useState("");
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [existingAttendance, setExistingAttendance] = useState({});
  const [times, setTimes] = useState({});
  const [lessons, setLessons] = useState([]);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(false);

  const total = students.length;
  const came = Object.values(attendance).filter(Boolean).length;
  const absent = total - came;

  const startTime =
    groupData?.lessonTime || groupData?.time || group?.startTime || "18:30";
  const courseDuration = group?.course?.durationLesson;

  const lessonInfo = useMemo(() => {
    const teacherName =
      group?.teacher?.fullName || group?.teacherName || group?.teacher || "-";
    const roomName = group?.room?.name || group?.room || "-";
    const courseName =
      typeof group?.course === "string"
        ? group.course
        : group?.course?.name || "-";
    const dateLabel = lesson?.created_at
      ? formatLessonDate(lesson.created_at)
      : "-";
    const timeLabel = buildLessonTime(
      startTime,
      groupData || group,
      courseDuration,
    );
    const courseLabel = group?.name
      ? `${courseName} ${group.name}`
      : courseName;

    return {
      teacher: teacherName,
      role: "Teacher",
      date: dateLabel,
      time: timeLabel,
      room: roomName,
      course: courseLabel,
    };
  }, [group, lesson]);

  useEffect(() => {
    if (!resolvedGroupId) return;
    let isActive = true;

    const loadAttendance = async () => {
      setLoading(true);
      setError("");

      try {
        const [studentsResult, lessonsResult] = await Promise.all([
          groupsApi.getStudentsByGroup(resolvedGroupId),
          lessonsApi.getByGroup(resolvedGroupId),
        ]);

        if (!isActive) return;

        const studentsList = Array.isArray(studentsResult?.data)
          ? studentsResult.data
          : [];
        const lessonsList = Array.isArray(lessonsResult?.data)
          ? lessonsResult.data
          : [];

        const latestLesson = lessonsList
          .slice()
          .sort((a, b) => (b?.id || 0) - (a?.id || 0))[0];
        const nextSelected = selectedLessonId || latestLesson?.id || null;
        const selectedLesson =
          lessonsList.find((item) => item.id === nextSelected) ||
          latestLesson ||
          null;

        setStudents(studentsList);
        setLessons(lessonsList);
        setSelectedLessonId(nextSelected);
        setLesson(selectedLesson);

        setTimes((prev) => {
          const next = { ...prev };
          const defaultTime = startTime;
          studentsList.forEach((student) => {
            if (!next[student.id]) {
              next[student.id] = defaultTime;
            }
          });
          return next;
        });

        if (!nextSelected) {
          setAttendance({});
          setExistingAttendance({});
        }
      } catch (err) {
        if (isActive) {
          setError(
            "Ma'lumotlarni yuklashda xatolik yuz berdi. Qayta urinib ko'ring.",
          );
        }
      } finally {
        if (isActive) setLoading(false);
      }
    };

    loadAttendance();
    return () => {
      isActive = false;
    };
  }, [
    resolvedGroupId,
    group?.startTime,
    groupData?.lessonTime,
    groupData?.time,
  ]);

  useEffect(() => {
    if (!selectedLessonId) return;
    let isActive = true;
    const selectedLesson =
      lessons.find((item) => item.id === selectedLessonId) || null;
    setLesson(selectedLesson);

    const loadLessonAttendance = async () => {
      try {
        const attendanceResult =
          await attendanceApi.getByLesson(selectedLessonId);
        const rows = Array.isArray(attendanceResult?.data)
          ? attendanceResult.data
          : [];

        const attendanceMap = rows.reduce((acc, row) => {
          const studentId = row?.student?.id;
          if (studentId) {
            acc[studentId] = Boolean(row?.isPresent);
          }
          return acc;
        }, {});

        const existingMap = rows.reduce((acc, row) => {
          const studentId = row?.student?.id;
          if (studentId) {
            acc[studentId] = true;
          }
          return acc;
        }, {});

        if (isActive) setAttendance(attendanceMap);
        if (isActive) setExistingAttendance(existingMap);
      } catch {
        if (isActive) {
          setError(
            "Davomatni yuklashda xatolik yuz berdi. Qayta urinib ko'ring.",
          );
        }
      }
    };

    loadLessonAttendance();
    return () => {
      isActive = false;
    };
  }, [selectedLessonId, lessons]);

  const handleToggle = (studentId, val) => {
    setAttendance((prev) => ({ ...prev, [studentId]: val }));
  };

  const handleTime = (studentId, val) => {
    setTimes((prev) => ({ ...prev, [studentId]: val }));
  };

  function formatLessonDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    const months = [
      "yanvar",
      "fevral",
      "mart",
      "aprel",
      "may",
      "iyun",
      "iyul",
      "avgust",
      "sentabr",
      "oktabr",
      "noyabr",
      "dekabr",
    ];
    const day = date.getDate();
    const month = months[date.getMonth()] || "";
    const year = date.getFullYear();
    return `${day}-${month} ${year}`.trim();
  }

  function buildLessonTime(startTime, sourceGroup, courseDurationMinutes) {
    if (!startTime) return "-";
    const durationMinutes =
      parseDurationMinutes(courseDurationMinutes) ||
      parseDurationMinutes(sourceGroup?.durationLesson) ||
      parseDurationMinutes(sourceGroup?.duration);
    if (!durationMinutes) return startTime;

    const [hourStr, minuteStr] = String(startTime).split(":");
    const hour = Number(hourStr);
    const minute = Number(minuteStr);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return startTime;

    const totalMinutes = hour * 60 + minute + durationMinutes;
    const endHour = Math.floor(totalMinutes / 60) % 24;
    const endMinute = totalMinutes % 60;
    const pad = (num) => String(num).padStart(2, "0");
    return `${pad(hour)}:${pad(minute)} - ${pad(endHour)}:${pad(endMinute)}`;
  }

  function parseDurationMinutes(value) {
    if (!value) return 0;
    if (typeof value === "number") return value;
    const raw = String(value).toLowerCase();
    const match = raw.match(/\d+/);
    return match ? Number(match[0]) : 0;
  }

  const handleSave = () => {
    if (!lesson?.id) {
      setToast(true);
      setTimeout(() => setToast(false), 2500);
      return;
    }

    const saveAttendance = async () => {
      try {
        const updates = students.map((student) => {
          const payload = {
            lessonId: lesson.id,
            studentId: student.id,
            isPresent: Boolean(attendance[student.id]),
          };

          if (existingAttendance[student.id]) {
            return attendanceApi.update(payload);
          }

          return attendanceApi.create(payload);
        });

        await Promise.all(updates);
        setExistingAttendance((prev) => {
          const next = { ...prev };
          students.forEach((student) => {
            next[student.id] = true;
          });
          return next;
        });

        setToast(true);
        setTimeout(() => setToast(false), 2500);
      } catch {
        setError("Davomatni saqlashda xatolik yuz berdi.");
      }
    };

    saveAttendance();
  };

  if (!resolvedGroupId) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>Guruh tanlanmadi.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>Ma'lumotlar yuklanmoqda...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>{error}</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.teacherRow}>
          <div style={styles.avatar}>AS</div>
          <div>
            <p style={styles.teacherName}>{lessonInfo.teacher}</p>
            <p style={styles.teacherRole}>{lessonInfo.role}</p>
          </div>
        </div>
        <div style={styles.metaGrid}>
          <div>
            <span style={styles.metaLabel}>Dars kuni</span>
            <select
              style={styles.metaSelect}
              value={selectedLessonId ?? ""}
              onChange={(e) =>
                setSelectedLessonId(
                  e.target.value ? Number(e.target.value) : null,
                )
              }
            >
              <option value="">Tanlang</option>
              {lessons.map((item) => (
                <option key={item.id} value={item.id}>
                  {formatLessonDate(item.created_at)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <span style={styles.metaLabel}>Dars vaqti</span>
            <span style={styles.metaValue}>{lessonInfo.time}</span>
          </div>
          <div>
            <span style={styles.metaLabel}>Xona</span>
            <span style={styles.metaValue}>{lessonInfo.room}</span>
          </div>
        </div>
      </div>

      <div style={styles.courseBadge}>{lessonInfo.course}</div>

      <div style={styles.card}>
        <p style={styles.sectionTitle}>Yo'qlama va mavzu kiritish</p>
        <div style={styles.formGroup}>
          <label style={styles.formLabel}>* Mavzu</label>
          <input
            type="text"
            value={mavzu}
            onChange={(e) => setMavzu(e.target.value)}
            placeholder="Dars mavzusini kiriting..."
            style={styles.input}
          />
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.statRow}>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>Jami</div>
            <div style={styles.statVal}>{total}</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>Keldi</div>
            <div style={{ ...styles.statVal, color: "#1D9E75" }}>{came}</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>Kelmadi</div>
            <div style={{ ...styles.statVal, color: "#9ca3af" }}>{absent}</div>
          </div>
        </div>

        <table style={styles.table}>
          <thead>
            <tr style={styles.theadRow}>
              <th style={{ ...styles.th, width: 40 }}>#</th>
              <th style={styles.th}>O'quvchi ismi</th>
              <th style={styles.th}>Vaqti</th>
              <th style={styles.th}>Keldi</th>
              <th style={styles.th}>Holat</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr style={styles.tr}>
                <td
                  colSpan={5}
                  style={{
                    ...styles.td,
                    color: "#9ca3af",
                    textAlign: "center",
                  }}
                >
                  O'quvchilar topilmadi.
                </td>
              </tr>
            ) : (
              students.map((student, i) => (
                <tr key={student.id || i} style={styles.tr}>
                  <td style={{ ...styles.td, color: "#9ca3af", fontSize: 12 }}>
                    {i + 1}
                  </td>
                  <td style={styles.td}>{student.fullName || student.name}</td>
                  <td style={styles.td}>
                    <input
                      type="time"
                      value={times[student.id] || ""}
                      onChange={(e) => handleTime(student.id, e.target.value)}
                      style={styles.timeInput}
                    />
                  </td>
                  <td style={styles.td}>
                    <Toggle
                      checked={Boolean(attendance[student.id])}
                      onChange={(val) => handleToggle(student.id, val)}
                    />
                  </td>
                  <td style={styles.td}>
                    <StatusBadge came={Boolean(attendance[student.id])} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div
          style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}
        >
          <button onClick={handleSave} style={styles.saveBtn}>
            Saqlash
          </button>
        </div>
      </div>

      {toast && <div style={styles.toast}>Davomat saqlandi!</div>}
    </div>
  );
}

const styles = {
  page: {
    fontFamily: "'DM Sans', sans-serif",
    maxWidth: 800,
    margin: "0 auto",
    padding: "24px 16px",
    background: "#f9fafb",
    minHeight: "100vh",
  },
  card: {
    background: "#ffffff",
    border: "0.5px solid #e5e7eb",
    borderRadius: 12,
    padding: "20px",
    marginBottom: 12,
  },
  teacherRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: "#EFF6FF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 500,
    fontSize: 14,
    color: "#3B82F6",
    flexShrink: 0,
  },
  teacherName: {
    fontWeight: 500,
    fontSize: 15,
    color: "#111827",
    margin: 0,
  },
  teacherRole: {
    fontSize: 12,
    color: "#6b7280",
    margin: 0,
  },
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
    marginTop: 8,
  },
  metaLabel: {
    display: "block",
    fontSize: 11,
    color: "#9ca3af",
    marginBottom: 2,
  },
  metaValue: {
    display: "block",
    fontSize: 13,
    fontWeight: 500,
    color: "#111827",
  },
  metaSelect: {
    width: "100%",
    height: 32,
    padding: "0 8px",
    border: "0.5px solid #d1d5db",
    borderRadius: 8,
    background: "#ffffff",
    color: "#111827",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  },
  courseBadge: {
    display: "inline-flex",
    alignItems: "center",
    background: "#ffffff",
    border: "0.5px solid #e5e7eb",
    borderRadius: 8,
    padding: "6px 12px",
    fontSize: 13,
    fontWeight: 500,
    color: "#374151",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 500,
    color: "#111827",
    marginBottom: 12,
  },
  formGroup: {
    marginBottom: 4,
  },
  formLabel: {
    fontSize: 12,
    color: "#6b7280",
    display: "block",
    marginBottom: 4,
  },
  input: {
    width: "100%",
    height: 36,
    padding: "0 10px",
    border: "0.5px solid #d1d5db",
    borderRadius: 8,
    background: "#ffffff",
    color: "#111827",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },
  statRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    background: "#f9fafb",
    borderRadius: 8,
    padding: "10px 14px",
  },
  statLabel: {
    fontSize: 11,
    color: "#9ca3af",
  },
  statVal: {
    fontSize: 20,
    fontWeight: 500,
    color: "#111827",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
  },
  theadRow: {
    borderBottom: "0.5px solid #e5e7eb",
  },
  th: {
    padding: "8px 12px",
    textAlign: "left",
    fontSize: 11,
    fontWeight: 500,
    color: "#9ca3af",
  },
  tr: {
    borderBottom: "0.5px solid #f3f4f6",
  },
  td: {
    padding: "10px 12px",
    color: "#111827",
    fontSize: 13,
  },
  timeInput: {
    border: "0.5px solid #e5e7eb",
    borderRadius: 6,
    padding: "2px 6px",
    fontSize: 12,
    background: "#f9fafb",
    color: "#111827",
    width: 90,
  },
  toggleLabel: {
    cursor: "pointer",
    display: "inline-block",
  },
  toggleTrack: {
    display: "block",
    width: 40,
    height: 22,
    borderRadius: 11,
    transition: "background 0.2s",
    position: "relative",
  },
  toggleThumb: {
    display: "block",
    position: "absolute",
    width: 16,
    height: 16,
    top: 3,
    left: 3,
    background: "white",
    borderRadius: "50%",
    transition: "transform 0.2s",
  },
  badge: {
    display: "inline-block",
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 10,
    fontWeight: 500,
  },
  saveBtn: {
    height: 36,
    padding: "0 20px",
    background: "#1D9E75",
    color: "white",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
  },
  toast: {
    position: "fixed",
    bottom: 20,
    right: 20,
    background: "#1D9E75",
    color: "white",
    padding: "10px 18px",
    borderRadius: 8,
    fontSize: 13,
    zIndex: 99,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  },
};
