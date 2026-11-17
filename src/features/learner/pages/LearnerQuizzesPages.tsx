import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle, XCircle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  useLearnerQuiz,
  useLearnerQuizzes,
  useSubmitQuiz,
} from '@/features/learner/api/learnerApi';
import {
  LearnerPageHeader,
  Pill,
  QueryState,
  errorMessage,
  useLearnerFormat,
} from '@/features/learner/components/LearnerUi';
import type { LearnerQuiz, LearnerQuizResult } from '@/features/learner/types';

function ResultPill({ best }: { best: NonNullable<LearnerQuiz['best']> }) {
  const { t } = useTranslation();
  if (best.status === 'needs_review')
    return <Pill tone="info">{t('learner.quizzes.review')}</Pill>;
  return best.passed ? (
    <Pill tone="success">{t('learner.quizzes.passed')}</Pill>
  ) : (
    <Pill tone="danger">{t('learner.quizzes.failed')}</Pill>
  );
}

export function LearnerQuizzesPage() {
  const { t } = useTranslation();
  const f = useLearnerFormat();
  const list = useLearnerQuizzes();
  return (
    <div className="space-y-6">
      <LearnerPageHeader
        title={t('learner.quizzes.title')}
        subtitle={t('learner.quizzes.subtitle')}
      />
      <QueryState
        isLoading={list.isLoading}
        error={list.error}
        isEmpty={!list.data?.length}
        emptyText={t('learner.quizzes.empty')}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {list.data?.map((q) => (
            <Card key={q.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold">{q.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {q.group_name ?? q.course_name}
                  </p>
                </div>
                <Pill tone={q.kind === 'exam' ? 'warning' : 'info'}>
                  {t(
                    `learner.quizzes.kind.${q.kind === 'exam' ? 'exam' : 'quiz'}`,
                  )}
                </Pill>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>
                  {t('learner.quizzes.questions', { count: q.questions_count })}
                </span>
                {q.duration_min ? (
                  <span>
                    {t('learner.quizzes.duration', { count: q.duration_min })}
                  </span>
                ) : null}
                <span>
                  {t('learner.quizzes.pass', { percent: q.pass_percent })}
                </span>
                <span>
                  {t('learner.quizzes.attempts', {
                    used: q.attempts_used,
                    max: q.max_attempts,
                  })}
                </span>
                {q.ends_at ? <span>⏱ {f.dateTime(q.ends_at)}</span> : null}
              </div>
              {q.best ? (
                <div className="flex items-center gap-2 text-sm">
                  <span>
                    {t('learner.quizzes.best', { percent: q.best.percent })}
                  </span>
                  <ResultPill best={q.best} />
                </div>
              ) : null}
              <div className="mt-auto">
                {q.can_attempt ? (
                  <Button asChild>
                    <Link to="/learner/quizzes/$id" params={{ id: q.id }}>
                      {t('learner.quizzes.start')}
                    </Link>
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {t('learner.quizzes.unavailable')}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      </QueryState>
    </div>
  );
}

type Answer = number | number[] | string;

export function LearnerQuizPage({ id }: { id: string }) {
  const { t } = useTranslation();
  const quiz = useLearnerQuiz(id, {
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
  const submit = useSubmitQuiz(id);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [confirm, setConfirm] = useState(false);
  const [result, setResult] = useState<LearnerQuizResult | null>(null);
  const q = quiz.data;
  const answered = Object.values(answers).filter((v) =>
    Array.isArray(v) ? v.length : String(v).trim() !== '',
  ).length;

  const set = (qid: string, value: Answer) =>
    setAnswers((prev) => ({ ...prev, [qid]: value }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/learner/quizzes">
          <ArrowLeft aria-hidden /> {t('learner.quizzes.back')}
        </Link>
      </Button>
      <QueryState isLoading={quiz.isLoading} error={quiz.error}>
        {q ? (
          <>
            <LearnerPageHeader
              title={q.title}
              subtitle={[
                q.group_name ?? q.course_name,
                t('learner.quizzes.pass', { percent: q.pass_percent }),
              ]
                .filter(Boolean)
                .join(' · ')}
            />
            {result ? (
              <Card className="space-y-3 text-center">
                {result.passed ? (
                  <CheckCircle
                    weight="fill"
                    aria-hidden
                    className="mx-auto size-12 text-success"
                  />
                ) : (
                  <XCircle
                    weight="fill"
                    aria-hidden
                    className="mx-auto size-12 text-destructive"
                  />
                )}
                <p className="text-sm text-muted-foreground">
                  {t('learner.quizzes.result_title')}
                </p>
                <p className="text-4xl font-semibold tabular-nums">
                  {result.percent}%
                </p>
                <p className="text-sm">
                  {result.score} / {result.max_score} ·{' '}
                  {result.status === 'needs_review'
                    ? t('learner.quizzes.review')
                    : result.passed
                      ? t('learner.quizzes.passed')
                      : t('learner.quizzes.failed')}
                </p>
                <Button asChild variant="outline">
                  <Link to="/learner/quizzes">{t('learner.quizzes.back')}</Link>
                </Button>
              </Card>
            ) : !q.can_attempt ? (
              <p className="text-sm text-muted-foreground">
                {t('learner.quizzes.unavailable')}
              </p>
            ) : (
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  setConfirm(true);
                }}
              >
                {q.questions.map((question, index) => (
                  <Card key={question.id} className="space-y-3">
                    <p className="font-medium">
                      <span className="mr-2 text-muted-foreground">
                        {index + 1}.
                      </span>
                      {question.text}
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({question.points})
                      </span>
                    </p>
                    {question.type === 'single' ? (
                      <RadioGroup
                        value={
                          answers[question.id] !== undefined
                            ? String(answers[question.id])
                            : ''
                        }
                        onValueChange={(v) => set(question.id, Number(v))}
                      >
                        {question.options.map((opt, i) => (
                          <label
                            key={i}
                            className="flex cursor-pointer items-center gap-3 rounded-md border border-hair px-3 py-2 text-sm hover:bg-muted"
                          >
                            <RadioGroupItem value={String(i)} />
                            {opt}
                          </label>
                        ))}
                      </RadioGroup>
                    ) : question.type === 'multiple' ? (
                      <div className="space-y-2">
                        {question.options.map((opt, i) => {
                          const current =
                            (answers[question.id] as number[] | undefined) ??
                            [];
                          return (
                            <label
                              key={i}
                              className="flex cursor-pointer items-center gap-3 rounded-md border border-hair px-3 py-2 text-sm hover:bg-muted"
                            >
                              <Checkbox
                                checked={current.includes(i)}
                                onCheckedChange={(checked) =>
                                  set(
                                    question.id,
                                    checked
                                      ? [...current, i]
                                      : current.filter((x) => x !== i),
                                  )
                                }
                              />
                              {opt}
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <Input
                        value={
                          (answers[question.id] as string | undefined) ?? ''
                        }
                        onChange={(e) => set(question.id, e.target.value)}
                        placeholder={t('learner.quizzes.text_placeholder')}
                      />
                    )}
                  </Card>
                ))}
                <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-lg border border-border bg-background/95 p-3 backdrop-blur">
                  <span className="text-sm text-muted-foreground">
                    {t('learner.quizzes.answered', {
                      count: answered,
                      total: q.questions.length,
                    })}
                  </span>
                  <Button type="submit" disabled={submit.isPending}>
                    {t('learner.quizzes.submit')}
                  </Button>
                </div>
              </form>
            )}
            <ConfirmDialog
              open={confirm}
              onClose={() => setConfirm(false)}
              title={t('learner.quizzes.submit')}
              description={t('learner.quizzes.submit_confirm')}
              confirmLabel={t('learner.quizzes.submit')}
              loading={submit.isPending}
              onConfirm={() =>
                submit.mutate(answers, {
                  onSuccess: (data) => {
                    setConfirm(false);
                    setResult(data);
                  },
                  onError: (err) => {
                    setConfirm(false);
                    toast.error(errorMessage(err, t('learner.errors.generic')));
                  },
                })
              }
            />
          </>
        ) : null}
      </QueryState>
    </div>
  );
}
