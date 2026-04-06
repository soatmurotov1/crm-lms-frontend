import { useEffect, useMemo, useState } from "react";
import { formatUzDate } from "../../../utils/date";

const isList = (value) => Array.isArray(value) && value.length > 0;

const STATUS_META = {
  APPROVED: { label: "Qabul qilingan", className: "status-approved" },
  REJECTED: { label: "Qaytarilgan", className: "status-rejected" },
  NOT_REVIEWED: { label: "Bajarilmagan", className: "status-not-reviewed" },
  PENDING: { label: "Kutayotganlar", className: "status-pending" },
  NOT_GIVEN: { label: "Berilmagan", className: "status-not-given" },
};

export default function StudentGroups({
  groups,
  groupsLoading,
  selectedGroupId,
  onSelectGroup,
  lessons,
  lessonsLoading,
  selectedLessonId,
  onSelectLesson,
  selectedLesson,
  videoCountByLesson,
  lessonVideos,
  homeworksByLesson,
  homeworksLoading,
}) {
  const showGroups = !groupsLoading && isList(groups);
  const showLessons = !lessonsLoading && isList(lessons);
  const selectedLessonVideos = isList(lessonVideos)
    ? lessonVideos.filter((item) => item?.lesson?.id === selectedLessonId)
    : [];
  const [showHomeworkView, setShowHomeworkView] = useState(false);
  const [homeworkFilter, setHomeworkFilter] = useState("all");

  const showGroupsOnly = false;

  useEffect(() => {
    if (selectedGroupId) {
      setShowHomeworkView(true);
    }
  }, [selectedGroupId]);

  const lessonRows = useMemo(() => {
    if (!showLessons) return [];

    return lessons
      .map((lesson) => {
        const homework = homeworksByLesson?.[lesson.id] || null;
        const status = homework
          ? homework.status || "NOT_REVIEWED"
          : "NOT_GIVEN";
        return {
          lesson,
          homework,
          status,
          videoCount: videoCountByLesson?.[lesson.id] || 0,
        };
      })
      .filter((row) => {
        if (homeworkFilter === "all") return true;
        if (homeworkFilter === "APPROVED") return row.status === "APPROVED";
        if (homeworkFilter === "NOT_GIVEN") return row.status === "NOT_GIVEN";
        if (homeworkFilter === "REJECTED") return row.status === "REJECTED";
        if (homeworkFilter === "NOT_REVIEWED")
          return row.status === "NOT_REVIEWED";
        if (homeworkFilter === "PENDING") return row.status === "PENDING";
        return true;
      });
  }, [
    showLessons,
    lessons,
    homeworksByLesson,
    videoCountByLesson,
    homeworkFilter,
  ]);

  return (
    <section className="student-page">
      <h1>Guruhlarim</h1>

      {showGroups && !showHomeworkView ? (
        <div className="student-card student-table-card">
          <div className="student-table">
            <div className="student-table-head">
              <div>#</div>
              <div>Guruh nomi</div>
              <div>Yo'nalish</div>
              <div>O'qituvchi</div>
              <div>Boshlash vaqti</div>
            </div>
            {groups.map((group, index) => (
              <button
                type="button"
                key={group.id}
                className={`student-table-row${
                  selectedGroupId === group.id ? " active" : ""
                }`}
                onClick={() => {
                  onSelectGroup(group.id);
                  setShowHomeworkView(true);
                }}
              >
                <div>{index + 1}</div>
                <div className="strong">{group.name}</div>
                <div>{group.course?.name || "-"}</div>
                <div>{group.teacher?.fullName || "-"}</div>
                <div>
                  {group.startDate ? formatUzDate(group.startDate) : "-"}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {showLessons && showHomeworkView && !showGroupsOnly ? (
        <div className="student-card student-homework-card">
          <div className="student-homework-header">
            <button
              type="button"
              className="student-back-btn"
              onClick={() => setShowHomeworkView(false)}
            >
              ← Orqaga
            </button>
            <h2>Uy vazifa statusi</h2>
          </div>

          <div className="student-homework-controls">
            <select
              className="student-select"
              value={homeworkFilter}
              onChange={(event) => setHomeworkFilter(event.target.value)}
            >
              <option value="all">Barchasi</option>
              <option value="APPROVED" className="student-option-approved">
                Qabul qilingan
              </option>
              <option value="NOT_GIVEN" className="student-option-not-given">
                Berilmagan
              </option>
              <option value="REJECTED" className="student-option-rejected">
                Qaytarilgan
              </option>
              <option
                value="NOT_REVIEWED"
                className="student-option-not-reviewed"
              >
                Bajarilmagan
              </option>
              <option value="PENDING" className="student-option-pending">
                Kutayotganlar
              </option>
            </select>
          </div>

          <div className="student-homework-table">
            <div className="student-homework-row header">
              <div>Dars nomi</div>
              <div>Video</div>
              <div>Uyga vazifa holati</div>
              <div>Uyga vazifa muddati</div>
              <div>Dars sanasi</div>
            </div>
            {lessonRows.map((row) => (
              <button
                type="button"
                key={row.lesson.id}
                className="student-homework-row"
                onClick={() => onSelectLesson(row.lesson.id)}
              >
                <div className="student-link">{row.lesson.title || "Dars"}</div>
                <div>
                  <div className="student-video-count">{row.videoCount}</div>
                </div>
                <div>
                  <span
                    className={`student-status ${
                      STATUS_META[row.status]?.className || "status-not-given"
                    }`}
                  >
                    {STATUS_META[row.status]?.label || "Berilmagan"}
                  </span>
                </div>
                <div>
                  {row.homework?.durationTime ? (
                    <span>{row.homework.durationTime}</span>
                  ) : null}
                </div>
                <div>
                  {row.lesson.created_at
                    ? formatUzDate(row.lesson.created_at)
                    : null}
                </div>
              </button>
            ))}
            {!homeworksLoading && lessonRows.length === 0 ? (
              <div className="student-homework-empty">Ma'lumot topilmadi</div>
            ) : null}
          </div>
        </div>
      ) : null}

      {showLessons && !showGroupsOnly && !showHomeworkView ? (
        <div className="student-split">
          <div className="student-card">
            <div className="student-card-title">Darslar</div>
            <div className="student-stack">
              {lessons.map((lesson) => (
                <button
                  type="button"
                  key={lesson.id}
                  className={`student-lesson-item${
                    selectedLessonId === lesson.id ? " active" : ""
                  }`}
                  onClick={() => onSelectLesson(lesson.id)}
                >
                  <div className="student-item-title">
                    {lesson.title || "Dars"}
                  </div>
                  {lesson.created_at ? (
                    <div className="student-item-sub">
                      {formatUzDate(lesson.created_at)}
                    </div>
                  ) : null}
                  {videoCountByLesson?.[lesson.id] ? (
                    <span className="student-pill">
                      Video: {videoCountByLesson[lesson.id]}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          {selectedLesson ? (
            <div className="student-card">
              <div className="student-card-title">
                {selectedLesson.title || "Dars tafsilotlari"}
              </div>

              {selectedLesson.created_at ? (
                <div className="student-muted">
                  Sana: {formatUzDate(selectedLesson.created_at)}
                </div>
              ) : null}

              {isList(selectedLessonVideos) ? (
                <div className="student-section">
                  <div className="student-section-title">Video darslar</div>
                  <div className="student-stack">
                    {selectedLessonVideos.map((video) => (
                      <div key={video.id} className="student-item">
                        <div className="student-item-main">
                          <div className="student-item-title">
                            {video.lesson?.title || "Video"}
                          </div>
                          {video.created_at ? (
                            <div className="student-item-sub">
                              {formatUzDate(video.created_at)}
                            </div>
                          ) : null}
                        </div>
                        {video.file ? (
                          <a
                            className="student-link"
                            href={video.file}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Fayl
                          </a>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {!homeworksLoading && homeworksByLesson?.[selectedLessonId] ? (
                <div className="student-section">
                  <div className="student-section-title">Uy vazifa</div>
                  <div className="student-item">
                    <div className="student-item-main">
                      <div className="student-item-title">
                        {homeworksByLesson[selectedLessonId].title}
                      </div>
                      {homeworksByLesson[selectedLessonId].created_at ? (
                        <div className="student-item-sub">
                          {formatUzDate(
                            homeworksByLesson[selectedLessonId].created_at,
                          )}
                        </div>
                      ) : null}
                      {homeworksByLesson[selectedLessonId].durationTime ? (
                        <div className="student-item-sub">
                          Muddati:{" "}
                          {homeworksByLesson[selectedLessonId].durationTime}
                        </div>
                      ) : null}
                    </div>
                    {homeworksByLesson[selectedLessonId].file ? (
                      <a
                        className="student-link"
                        href={homeworksByLesson[selectedLessonId].file}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Fayl
                      </a>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
