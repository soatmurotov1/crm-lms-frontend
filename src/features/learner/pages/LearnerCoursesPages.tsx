import { safeUrl } from '@/lib/safeUrl';
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  CaretDown,
  CheckCircle,
  Circle,
  DownloadSimple,
  LinkSimple,
  PlayCircle,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  materialDownloadUrl,
  useLearnerCourse,
  useLearnerCourses,
  useToggleLessonProgress,
} from '@/features/learner/api/learnerApi';
import {
  LearnerPageHeader,
  ProgressBar,
  QueryState,
} from '@/features/learner/components/LearnerUi';

export function LearnerCoursesPage() {
  const { t } = useTranslation();
  const courses = useLearnerCourses();
  return (
    <div className="space-y-6">
      <LearnerPageHeader
        title={t('learner.courses.title')}
        subtitle={t('learner.courses.subtitle')}
      />
      <QueryState
        isLoading={courses.isLoading}
        error={courses.error}
        isEmpty={!courses.data?.length}
        emptyText={t('learner.courses.empty')}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {courses.data?.map((c) => (
            <Card key={c.id} className="flex flex-col gap-4">
              <div>
                <p className="text-lg font-semibold">{c.name}</p>
                {c.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {c.description}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t('learner.courses.lessons', {
                      done: c.completed_count,
                      total: c.lessons_count,
                    })}
                  </span>
                  <span className="font-semibold tabular-nums">
                    {c.progress}%
                  </span>
                </div>
                <ProgressBar value={c.progress} />
              </div>
              <Button asChild variant="outline" className="mt-auto self-start">
                <Link to="/learner/courses/$id" params={{ id: c.id }}>
                  {t('learner.courses.open')}
                </Link>
              </Button>
            </Card>
          ))}
        </div>
      </QueryState>
    </div>
  );
}

export function LearnerCoursePage({ id }: { id: string }) {
  const { t } = useTranslation();
  const course = useLearnerCourse(id);
  const toggle = useToggleLessonProgress(id);
  const [open, setOpen] = useState<string | null>(null);
  const c = course.data;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/learner/courses">
          <ArrowLeft aria-hidden /> {t('learner.courses.back')}
        </Link>
      </Button>
      <QueryState isLoading={course.isLoading} error={course.error}>
        {c ? (
          <>
            <LearnerPageHeader
              title={c.name}
              subtitle={c.description ?? undefined}
            />
            <div className="max-w-md space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t('learner.courses.done')}
                </span>
                <span className="font-semibold tabular-nums">
                  {c.progress}%
                </span>
              </div>
              <ProgressBar value={c.progress} />
            </div>
            <div className="space-y-4">
              {c.modules.map((m) => (
                <Card
                  key={m.id}
                  heading={m.title}
                  description={m.description ?? undefined}
                >
                  {m.lessons.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t('learner.courses.no_lessons')}
                    </p>
                  ) : (
                    <ul className="divide-y divide-hair">
                      {m.lessons.map((l) => {
                        const expanded = open === l.id;
                        return (
                          <li key={l.id} className="py-2">
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                aria-label={
                                  l.completed
                                    ? t('learner.courses.done')
                                    : t('learner.courses.mark_done')
                                }
                                disabled={toggle.isPending}
                                onClick={() =>
                                  toggle.mutate({
                                    lessonId: l.id,
                                    completed: !l.completed,
                                  })
                                }
                                className={cn(
                                  'shrink-0',
                                  l.completed
                                    ? 'text-success'
                                    : 'text-muted-foreground hover:text-foreground',
                                )}
                              >
                                {l.completed ? (
                                  <CheckCircle
                                    weight="fill"
                                    className="size-5"
                                  />
                                ) : (
                                  <Circle className="size-5" />
                                )}
                              </button>
                              <button
                                type="button"
                                aria-expanded={expanded}
                                onClick={() => setOpen(expanded ? null : l.id)}
                                className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
                              >
                                <span className="truncate text-sm font-medium">
                                  {l.title}
                                </span>
                                <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                                  {l.duration_min
                                    ? t('learner.courses.minutes', {
                                        count: l.duration_min,
                                      })
                                    : null}
                                  <CaretDown
                                    aria-hidden
                                    className={cn(
                                      'size-4 transition-transform',
                                      expanded && 'rotate-180',
                                    )}
                                  />
                                </span>
                              </button>
                            </div>
                            {expanded ? (
                              <div className="ml-8 mt-3 space-y-3 text-sm">
                                {l.content ? (
                                  <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                                    {l.content.replace(/^#+\s*/gm, '')}
                                  </p>
                                ) : null}
                                <div className="flex flex-wrap gap-2">
                                  {l.video_url ? (
                                    <Button asChild size="sm" variant="outline">
                                      <a
                                        href={safeUrl(l.video_url)}
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        <PlayCircle aria-hidden />{' '}
                                        {t('learner.courses.video')}
                                      </a>
                                    </Button>
                                  ) : null}
                                  {l.materials.map((mat) => (
                                    <Button
                                      key={mat.id}
                                      asChild
                                      size="sm"
                                      variant="outline"
                                    >
                                      <a
                                        href={
                                          mat.has_file
                                            ? materialDownloadUrl(mat.id)
                                            : (safeUrl(mat.url) ?? '#')
                                        }
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        {mat.has_file ? (
                                          <DownloadSimple aria-hidden />
                                        ) : (
                                          <LinkSimple aria-hidden />
                                        )}
                                        {mat.title}
                                      </a>
                                    </Button>
                                  ))}
                                </div>
                                {!l.completed ? (
                                  <Button
                                    size="sm"
                                    disabled={toggle.isPending}
                                    onClick={() =>
                                      toggle.mutate({
                                        lessonId: l.id,
                                        completed: true,
                                      })
                                    }
                                  >
                                    <CheckCircle aria-hidden />{' '}
                                    {t('learner.courses.mark_done')}
                                  </Button>
                                ) : null}
                              </div>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Card>
              ))}
            </div>
          </>
        ) : null}
      </QueryState>
    </div>
  );
}
