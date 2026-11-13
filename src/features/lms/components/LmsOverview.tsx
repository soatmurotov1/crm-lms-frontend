import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/StatCard';
import { formatPercent, useLmsSummary } from '@/features/lms/api/lmsService';
import { formatDateTime } from './LmsCommon';

/** Dashboard ustidagi LMS bloki: o'quv jarayoni ko'rsatkichlari. */
export const LmsOverview = () => {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useLmsSummary();
  if (isError || (!isLoading && !data)) return null;

  return (
    <section aria-labelledby="lms-overview-title" className="mb-4 space-y-3">
      <h2 id="lms-overview-title" className="font-heading text-lg font-semibold">
        {t('lms.dashboard.title')}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t('lms.dashboard.courses')}
          value={data?.courses ?? '—'}
          secondary={t('lms.dashboard.subjects', { count: data?.subjects ?? 0 })}
          isLoading={isLoading}
        />
        <StatCard
          label={t('lms.dashboard.active_students')}
          value={data?.active_students ?? '—'}
          secondary={t('lms.dashboard.teachers', { count: data?.active_teachers ?? 0 })}
          tone="info"
          isLoading={isLoading}
        />
        <StatCard
          label={t('lms.dashboard.open_assignments')}
          value={data?.open_assignments ?? '—'}
          secondary={t('lms.dashboard.pending_review', { count: data?.pending_review ?? 0 })}
          tone="warning"
          isLoading={isLoading}
        />
        <StatCard
          label={t('lms.dashboard.quiz_average')}
          value={formatPercent(data?.quiz_average_30d)}
          secondary={t('lms.dashboard.attendance_rate', {
            value: formatPercent(data?.attendance_rate_30d),
          })}
          tone="success"
          isLoading={isLoading}
        />
      </div>
      {data && (data.upcoming_deadlines.length > 0 || data.recent_results.length > 0) ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <Card className="space-y-2">
            <h3 className="text-sm font-semibold">{t('lms.dashboard.upcoming')}</h3>
            {data.upcoming_deadlines.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('lms.dashboard.no_upcoming')}</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {data.upcoming_deadlines.map((row) => (
                  <li key={row.id} className="flex justify-between gap-2 py-2">
                    <Link to="/assignments/$id" params={{ id: row.id }} className="truncate hover:underline">
                      {row.title}
                      {row.group_name ? (
                        <span className="text-muted-foreground"> · {row.group_name}</span>
                      ) : null}
                    </Link>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {formatDateTime(row.due_date)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card className="space-y-2">
            <h3 className="text-sm font-semibold">{t('lms.dashboard.recent_results')}</h3>
            {data.recent_results.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('lms.grades.empty_title')}</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {data.recent_results.map((row) => (
                  <li key={row.id} className="flex justify-between gap-2 py-2">
                    <span className="truncate">
                      {row.student_name}
                      <span className="text-muted-foreground"> · {row.quiz_title}</span>
                    </span>
                    <span className={row.passed ? 'shrink-0 text-success' : 'shrink-0 text-destructive'}>
                      {formatPercent(row.percent)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      ) : null}
    </section>
  );
};
