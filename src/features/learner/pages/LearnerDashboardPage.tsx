import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  CalendarCheck,
  ClipboardText,
  Exam,
  UsersThree,
  Wallet,
} from '@phosphor-icons/react';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/StatCard';
import {
  useLearnerDashboard,
  useLearnerGroups,
} from '@/features/learner/api/learnerApi';
import { useLearnerStore } from '@/features/learner/api/learnerStore';
import {
  LearnerPageHeader,
  Pill,
  QueryState,
  useLearnerFormat,
} from '@/features/learner/components/LearnerUi';

export default function LearnerDashboardPage() {
  const { t } = useTranslation();
  const f = useLearnerFormat();
  const profile = useLearnerStore((s) => s.profile);
  const dashboard = useLearnerDashboard();
  const groups = useLearnerGroups();
  const d = dashboard.data;
  const portal = profile?.portal;
  const debt = Number(d?.balance?.debt ?? 0);

  return (
    <div className="space-y-6">
      <LearnerPageHeader
        title={t('learner.hello', {
          name: profile?.first_name ?? profile?.full_name ?? '',
        })}
        subtitle={t('learner.dashboard.subtitle')}
      />

      <QueryState isLoading={dashboard.isLoading} error={dashboard.error}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <StatCard
            label={t('learner.dashboard.groups')}
            value={d?.groups_count ?? 0}
            icon={<UsersThree aria-hidden />}
          />
          {d?.pending_assignments !== null &&
          d?.pending_assignments !== undefined ? (
            <Link to="/learner/assignments" className="block">
              <StatCard
                label={t('learner.dashboard.pending_assignments')}
                value={d.pending_assignments}
                icon={<ClipboardText aria-hidden />}
                tone={d.pending_assignments ? 'warning' : undefined}
              />
            </Link>
          ) : null}
          {d?.open_quizzes !== null && d?.open_quizzes !== undefined ? (
            <Link to="/learner/quizzes" className="block">
              <StatCard
                label={t('learner.dashboard.open_quizzes')}
                value={d.open_quizzes}
                icon={<Exam aria-hidden />}
                tone={d.open_quizzes ? 'info' : undefined}
              />
            </Link>
          ) : null}
          {d?.attendance_percent !== null &&
          d?.attendance_percent !== undefined ? (
            <StatCard
              label={t('learner.dashboard.attendance')}
              value={`${d.attendance_percent}%`}
              icon={<CalendarCheck aria-hidden />}
              tone="success"
            />
          ) : null}
          {d?.balance ? (
            <Link to="/learner/payments" className="block">
              <StatCard
                label={t('learner.dashboard.debt')}
                value={
                  debt > 0 ? f.money(debt) : t('learner.dashboard.no_debt')
                }
                icon={<Wallet aria-hidden />}
                tone={debt > 0 ? 'warning' : 'success'}
              />
            </Link>
          ) : null}
          {d?.unread_notifications !== null &&
          d?.unread_notifications !== undefined ? (
            <Link to="/learner/notifications" className="block">
              <StatCard
                label={t('learner.dashboard.unread')}
                value={d.unread_notifications}
                icon={<Bell aria-hidden />}
              />
            </Link>
          ) : null}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {portal?.schedule !== false ? (
            <Card heading={t('learner.dashboard.next_lessons')}>
              {d?.next_lessons.length ? (
                <ul className="divide-y divide-hair">
                  {d.next_lessons.map((l) => (
                    <li key={l.id} className="flex items-center gap-3 py-2.5">
                      <div className="w-24 shrink-0 text-xs text-muted-foreground">
                        {f.dayMonth(l.date)}
                        <span className="block text-base font-semibold tabular-nums text-foreground">
                          {f.time(l.date)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {l.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {l.group_name}
                          {l.teacher_name ? ` · ${l.teacher_name}` : ''}
                        </p>
                      </div>
                      <Pill
                        tone={l.lesson_type === 'practice' ? 'info' : 'muted'}
                      >
                        {t(
                          `learner.lesson_type.${l.lesson_type}`,
                          l.lesson_type,
                        )}
                      </Pill>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {t('learner.dashboard.no_lessons')}
                </p>
              )}
            </Card>
          ) : null}

          <Card heading={t('learner.dashboard.my_groups')}>
            <QueryState
              isLoading={groups.isLoading}
              error={groups.error}
              isEmpty={!groups.data?.length}
              emptyText="—"
            >
              <ul className="space-y-3">
                {groups.data?.map((g) => (
                  <li key={g.id} className="rounded-lg border border-hair p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold">{g.name}</p>
                      <span className="text-xs text-muted-foreground">
                        {g.course_name}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('learner.dashboard.teacher')}: {g.teacher_name ?? '—'}
                      {g.branch_name ? ` · ${g.branch_name}` : ''}
                    </p>
                    {g.schedule.length ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {g.schedule.map((s) => (
                          <Pill key={`${s.day_of_week}-${s.start_time}`}>
                            {t(`learner.days.${s.day_of_week}`).slice(0, 3)}{' '}
                            {s.start_time}–{s.end_time}
                          </Pill>
                        ))}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </QueryState>
          </Card>
        </div>
      </QueryState>
    </div>
  );
}
