import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLearnerSchedule } from '@/features/learner/api/learnerApi';
import {
  AttendancePill,
  LearnerPageHeader,
  Pill,
  QueryState,
  useLearnerFormat,
} from '@/features/learner/components/LearnerUi';
import type { LearnerScheduleLesson } from '@/features/learner/types';

const DAY = 24 * 60 * 60 * 1000;
const ymd = (d: Date) => d.toISOString().slice(0, 10);

/** Toshkent bo'yicha joriy haftaning dushanbasi (+ siljish). */
const weekStart = (offset: number) => {
  const now = new Date(Date.now() + 5 * 60 * 60 * 1000);
  const day = (now.getUTCDay() + 6) % 7;
  const monday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - day),
  );
  return new Date(monday.getTime() + offset * 7 * DAY);
};

export default function LearnerSchedulePage() {
  const { t } = useTranslation();
  const f = useLearnerFormat();
  const [offset, setOffset] = useState(0);
  const start = weekStart(offset);
  const end = new Date(start.getTime() + 6 * DAY);
  const schedule = useLearnerSchedule(ymd(start), ymd(end));

  const byDay = useMemo(() => {
    const map = new Map<string, LearnerScheduleLesson[]>();
    for (const lesson of schedule.data ?? []) {
      const key = lesson.date
        ? new Date(new Date(lesson.date).getTime() + 5 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10)
        : 'none';
      map.set(key, [...(map.get(key) ?? []), lesson]);
    }
    return map;
  }, [schedule.data]);

  const days = Array.from(
    { length: 7 },
    (_, i) => new Date(start.getTime() + i * DAY),
  );
  const [today] = useState(() =>
    ymd(new Date(Date.now() + 5 * 60 * 60 * 1000)),
  );

  return (
    <div className="space-y-6">
      <LearnerPageHeader
        title={t('learner.schedule.title')}
        subtitle={t('learner.schedule.subtitle')}
        actions={
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              aria-label={t('learner.schedule.prev')}
              onClick={() => setOffset((o) => o - 1)}
            >
              <CaretLeft aria-hidden />
            </Button>
            <Button
              variant="outline"
              onClick={() => setOffset(0)}
              disabled={offset === 0}
            >
              {t('learner.schedule.today')}
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label={t('learner.schedule.next')}
              onClick={() => setOffset((o) => o + 1)}
            >
              <CaretRight aria-hidden />
            </Button>
          </div>
        }
      />
      <p className="text-sm font-medium text-muted-foreground">
        {f.date(start.toISOString())} — {f.date(end.toISOString())}
      </p>
      <QueryState
        isLoading={schedule.isLoading}
        error={schedule.error}
        isEmpty={!schedule.data?.length}
        emptyText={t('learner.schedule.empty')}
      >
        <div className="space-y-3">
          {days.map((day) => {
            const key = ymd(day);
            const lessons = byDay.get(key);
            if (!lessons?.length) return null;
            return (
              <Card key={key} dense>
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  {t(`learner.days.${((day.getUTCDay() + 6) % 7) + 1}`)},{' '}
                  {f.date(`${key}T12:00:00Z`)}
                  {key === today ? (
                    <Pill tone="info">{t('learner.schedule.today')}</Pill>
                  ) : null}
                </p>
                <ul className="divide-y divide-hair">
                  {lessons.map((l) => (
                    <li
                      key={l.id}
                      className="flex flex-wrap items-center gap-3 py-2"
                    >
                      <span className="w-14 font-semibold tabular-nums">
                        {f.time(l.date)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {l.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {l.group_name}
                          {l.teacher_name ? ` · ${l.teacher_name}` : ''} ·{' '}
                          {t(
                            `learner.lesson_type.${l.lesson_type}`,
                            l.lesson_type,
                          )}
                        </p>
                      </div>
                      {l.attendance ||
                      (l.date && new Date(l.date).getTime() < Date.now()) ? (
                        <AttendancePill status={l.attendance} />
                      ) : null}
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      </QueryState>
    </div>
  );
}
