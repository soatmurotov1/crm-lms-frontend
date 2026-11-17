import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/StatCard';
import { cn } from '@/lib/utils';
import {
  useLearnerAttendance,
  useLearnerGrades,
  useLearnerNotifications,
  useLearnerPayments,
  useMarkNotificationsRead,
} from '@/features/learner/api/learnerApi';
import {
  AttendancePill,
  LearnerPageHeader,
  Pill,
  ProgressBar,
  QueryState,
  useLearnerFormat,
  type Tone,
} from '@/features/learner/components/LearnerUi';

const toneOf = (pct: number): Tone =>
  pct >= 80 ? 'success' : pct >= 60 ? 'warning' : 'danger';

export function LearnerGradesPage() {
  const { t } = useTranslation();
  const f = useLearnerFormat();
  const grades = useLearnerGrades();
  const g = grades.data;
  return (
    <div className="space-y-6">
      <LearnerPageHeader
        title={t('learner.grades.title')}
        subtitle={t('learner.grades.subtitle')}
      />
      <QueryState
        isLoading={grades.isLoading}
        error={grades.error}
        isEmpty={!g?.items.length}
        emptyText={t('learner.grades.empty')}
      >
        <div className="max-w-xs">
          <StatCard
            label={t('learner.grades.average')}
            value={`${g?.average_percent ?? 0}%`}
            tone="primary"
          />
        </div>
        <Card edgeToEdge>
          <ul className="divide-y divide-hair">
            {g?.items.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {t(`learner.grades.kind.${item.kind}`)} ·{' '}
                    {item.context ?? '—'} · {f.date(item.date)}
                  </p>
                  {item.feedback ? (
                    <p className="mt-1 text-xs">💬 {item.feedback}</p>
                  ) : null}
                </div>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {item.score}/{item.max_score}
                </span>
                <Pill tone={toneOf(item.percent)}>{item.percent}%</Pill>
              </li>
            ))}
          </ul>
        </Card>
      </QueryState>
    </div>
  );
}

export function LearnerAttendancePage() {
  const { t } = useTranslation();
  const f = useLearnerFormat();
  const att = useLearnerAttendance();
  const s = att.data?.summary;
  return (
    <div className="space-y-6">
      <LearnerPageHeader
        title={t('learner.attendance.title')}
        subtitle={t('learner.attendance.subtitle')}
      />
      <QueryState
        isLoading={att.isLoading}
        error={att.error}
        isEmpty={!att.data?.items.length}
        emptyText={t('learner.attendance.empty')}
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <StatCard
            label={t('learner.attendance.percent')}
            value={`${s?.percent ?? 0}%`}
            tone="primary"
          />
          <StatCard
            label={t('learner.attendance.total')}
            value={s?.total ?? 0}
          />
          <StatCard
            label={t('learner.attendance_status.present')}
            value={s?.present ?? 0}
            tone="success"
          />
          <StatCard
            label={t('learner.attendance_status.late')}
            value={s?.late ?? 0}
            tone="warning"
          />
          <StatCard
            label={t('learner.attendance_status.absent')}
            value={s?.absent ?? 0}
          />
        </div>
        <Card edgeToEdge>
          <ul className="divide-y divide-hair">
            {att.data?.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                <span className="w-28 shrink-0 text-sm tabular-nums text-muted-foreground">
                  {f.date(item.date)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {item.lesson_title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.group_name}
                  </p>
                </div>
                <AttendancePill status={item.status} />
              </li>
            ))}
          </ul>
        </Card>
      </QueryState>
    </div>
  );
}

const METHOD_KEY: Record<string, string> = {
  cash: 'cash',
  naqd: 'cash',
  card: 'card',
  karta: 'card',
  transfer: 'transfer',
  perechisleniya: 'transfer',
};

export function LearnerPaymentsPage() {
  const { t } = useTranslation();
  const f = useLearnerFormat();
  const pay = useLearnerPayments();
  const b = pay.data?.balance;
  const total = Number(b?.total_price ?? 0);
  const paid = Number(b?.paid ?? 0);
  const debt = Number(b?.debt ?? 0);
  return (
    <div className="space-y-6">
      <LearnerPageHeader
        title={t('learner.payments.title')}
        subtitle={t('learner.payments.subtitle')}
      />
      <QueryState isLoading={pay.isLoading} error={pay.error}>
        <div className="grid gap-3 md:grid-cols-3">
          <StatCard
            label={t('learner.payments.total')}
            value={f.money(total)}
          />
          <StatCard
            label={t('learner.payments.paid')}
            value={f.money(paid)}
            tone="success"
          />
          <StatCard
            label={
              debt < 0
                ? t('learner.payments.advance')
                : t('learner.payments.debt')
            }
            value={f.money(Math.abs(debt))}
            tone={debt > 0 ? 'warning' : 'success'}
          />
        </div>
        {total > 0 ? (
          <ProgressBar value={Math.round((paid / total) * 100)} />
        ) : null}
        <Card heading={t('learner.payments.history')}>
          {pay.data?.items.length ? (
            <ul className="divide-y divide-hair">
              {pay.data.items.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-2.5">
                  <span className="w-28 shrink-0 text-sm text-muted-foreground">
                    {f.date(p.paid_at)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {p.context ?? '—'}
                  </span>
                  {p.method ? (
                    <Pill>
                      {METHOD_KEY[p.method]
                        ? t(`learner.payments.method.${METHOD_KEY[p.method]}`)
                        : p.method.toUpperCase()}
                    </Pill>
                  ) : null}
                  <span className="font-semibold tabular-nums">
                    {f.money(p.amount)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t('learner.payments.empty')}
            </p>
          )}
        </Card>
      </QueryState>
    </div>
  );
}

export function LearnerNotificationsPage() {
  const { t } = useTranslation();
  const f = useLearnerFormat();
  const list = useLearnerNotifications();
  const mark = useMarkNotificationsRead();
  return (
    <div className="space-y-6">
      <LearnerPageHeader
        title={t('learner.notifications.title')}
        subtitle={t('learner.notifications.subtitle')}
        actions={
          list.data?.unread_count ? (
            <Button
              variant="outline"
              size="sm"
              disabled={mark.isPending}
              onClick={() => mark.mutate(undefined)}
            >
              {t('learner.notifications.mark_all')}
            </Button>
          ) : null
        }
      />
      <QueryState
        isLoading={list.isLoading}
        error={list.error}
        isEmpty={!list.data?.data.length}
        emptyText={t('learner.notifications.empty')}
      >
        <div className="space-y-3">
          {list.data?.data.map((n) => (
            <Card
              key={n.id}
              dense
              className={cn(!n.is_read && 'bg-info/5')}
              onClick={() => (!n.is_read ? mark.mutate(n.id) : undefined)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{n.title}</p>
                  <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                    {n.message}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {f.dateTime(n.created_at)}
                    {n.group_name ? ` · ${n.group_name}` : ''}
                    {n.created_by_name ? ` · ${n.created_by_name}` : ''}
                  </p>
                </div>
                {!n.is_read ? (
                  <Pill tone="info">{t('learner.notifications.new')}</Pill>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      </QueryState>
    </div>
  );
}
