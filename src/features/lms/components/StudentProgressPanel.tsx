import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatCard } from '@/components/ui/StatCard';
import { formatPercent, useGrades, useStudentProgress } from '@/features/lms/api/lmsService';
import { ListLoading, PercentBar, formatDateTime } from './LmsCommon';

export const StudentProgressPanel = ({ studentId }: { studentId: string }) => {
  const { t } = useTranslation();
  const progress = useStudentProgress(studentId);
  const grades = useGrades({ studentId, limit: 10 });

  if (progress.isLoading) return <ListLoading />;
  if (progress.isError || !progress.data) {
    return (
      <EmptyState
        title={t('lms.common.load_error')}
        action={{ label: t('common.retry'), onClick: () => void progress.refetch() }}
      />
    );
  }
  const data = progress.data;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t('lms.progress.overall')}
          value={formatPercent(data.overall_percent)}
          tone="primary"
        />
        <StatCard
          label={t('lms.progress.attendance')}
          value={formatPercent(data.attendance.total ? data.attendance.rate : null)}
          secondary={t('lms.progress.attended_of', {
            done: data.attendance.attended,
            total: data.attendance.total,
          })}
        />
        <StatCard
          label={t('lms.progress.avg_assignment')}
          value={formatPercent(data.assignments.average_percent)}
          tone="success"
          secondary={t('lms.progress.submitted_of', {
            done: data.assignments.submitted,
            total: data.assignments.total,
          })}
        />
        <StatCard
          label={t('lms.progress.avg_quiz')}
          value={formatPercent(data.quizzes.average_percent)}
          tone="info"
          secondary={t('lms.progress.passed_of', {
            done: data.quizzes.passed,
            total: data.quizzes.attempted,
          })}
        />
      </div>

      <Card className="space-y-3">
        <h3 className="font-heading text-base font-semibold">{t('lms.progress.courses')}</h3>
        {data.courses.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('lms.progress.no_courses')}</p>
        ) : (
          <ul className="space-y-3">
            {data.courses.map((course) => (
              <li key={course.course_id} className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <Link
                    to="/courses/$id"
                    params={{ id: course.course_id }}
                    className="font-medium hover:underline"
                  >
                    {course.course_name}
                  </Link>
                  <span className="text-muted-foreground tabular-nums">
                    {course.completed_lessons} / {course.total_lessons}
                  </span>
                </div>
                <PercentBar value={course.progress} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="space-y-3">
        <h3 className="font-heading text-base font-semibold">{t('lms.progress.recent_grades')}</h3>
        {(grades.data?.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('lms.grades.empty_title')}</p>
        ) : (
          <ul className="divide-y divide-border">
            {(grades.data?.data ?? []).map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{row.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {t(`lms.grades.source_${row.source}`)} · {formatDateTime(row.date)}
                  </p>
                </div>
                <span className="shrink-0 tabular-nums">
                  {row.score} / {row.max_score} ({formatPercent(row.percent)})
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};
