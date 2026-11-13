import { useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  CheckCircle,
  Exam,
  PencilSimple,
  Plus,
  ShieldCheck,
  Trash,
  Warning,
} from '@phosphor-icons/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EntityDetailShell } from '@/components/ui/EntityDetailShell';
import { StatCard } from '@/components/ui/StatCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCan } from '@/hooks/useCan';
import { useUrlTab } from '@/hooks/useUrlTab';
import { mutationErrorToast } from '@/lib/mutationErrorToast';
import {
  formatPercent,
  useDeleteQuestion,
  useDeleteQuiz,
  useQuiz,
  useQuizResults,
  useSaveQuiz,
} from '@/features/lms/api/lmsService';
import type { QuizQuestion, QuizResult } from '@/features/lms/types';
import { QuizFormDialog } from '@/features/lms/components/QuizFormDialog';
import { QuestionFormDialog } from '@/features/lms/components/QuestionFormDialog';
import {
  RecordAttemptDialog,
  ReviewAttemptDialog,
} from '@/features/lms/components/AttemptDialogs';
import {
  ListLoading,
  LmsStatusBadge,
  formatDateTime,
} from '@/features/lms/components/LmsCommon';

const ExamDetailPage = () => {
  const { id } = useParams({ strict: false });
  const navigate = useNavigate();
  const { t } = useTranslation();
  const canManage = useCan('manageLearning');
  const [tab, setTab] = useUrlTab(['questions', 'results'] as const, 'questions');
  const { data: quiz, isLoading, isError } = useQuiz(id);
  const results = useQuizResults(tab === 'results' ? id : undefined);
  const saveQuiz = useSaveQuiz();
  const removeQuiz = useDeleteQuiz();
  const removeQuestion = useDeleteQuestion(id ?? '');
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [question, setQuestion] = useState<QuizQuestion | 'new' | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<QuizQuestion | null>(null);
  const [attemptFor, setAttemptFor] = useState<QuizResult | null>(null);
  const [reviewFor, setReviewFor] = useState<QuizResult | null>(null);

  if (isLoading || isError || !quiz) {
    return (
      <EntityDetailShell
        onBack={() => navigate({ to: '/exams' })}
        backLabel={t('lms.exams.title')}
        isLoading={isLoading}
        isError={isError || !quiz}
        errorTitle={isError ? t('common.error') : t('common.not_found')}
        errorIcon={isError ? Warning : ShieldCheck}
      />
    );
  }

  const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);
  const setStatus = (status: 'published' | 'closed' | 'draft') =>
    saveQuiz.mutate(
      { id: quiz.id, status },
      {
        onSuccess: () => toast.success(t(`lms.exams.status_changed_${status}`)),
        onError: (error) => mutationErrorToast(error, t),
      },
    );

  const correctLabel = (q: QuizQuestion) =>
    q.type === 'text'
      ? q.correct.join(', ') || t('lms.questions.manual_review')
      : q.correct.map((i) => q.options[Number(i)]).filter(Boolean).join(', ');

  return (
    <EntityDetailShell
      onBack={() => navigate({ to: '/exams' })}
      backLabel={t('lms.exams.title')}
      isLoading={false}
      isError={false}
      title={quiz.title}
      description={
        <span className="text-sm text-muted-foreground">
          {t(`lms.exams.kind_${quiz.kind}`)} ·{' '}
          {[quiz.course_name, quiz.group_name].filter(Boolean).join(' · ')}
          {quiz.duration_min ? ` · ${t('lms.exams.minutes', { count: quiz.duration_min })}` : ''}
        </span>
      }
      meta={<LmsStatusBadge status={quiz.status} />}
      actions={
        canManage ? (
          <div className="flex flex-wrap gap-2">
            {quiz.status !== 'published' ? (
              <Button
                className="gap-2"
                disabled={saveQuiz.isPending || quiz.questions.length === 0}
                onClick={() => setStatus('published')}
              >
                <CheckCircle className="h-4 w-4" aria-hidden="true" /> {t('lms.exams.publish')}
              </Button>
            ) : (
              <Button variant="outline" disabled={saveQuiz.isPending} onClick={() => setStatus('closed')}>
                {t('lms.exams.close')}
              </Button>
            )}
            <Button variant="outline" className="gap-2" onClick={() => setEditOpen(true)}>
              <PencilSimple className="h-4 w-4" aria-hidden="true" /> {t('common.edit')}
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label={t('common.delete')}
              onClick={() => setDeleteOpen(true)}
            >
              <Trash className="h-4 w-4 text-destructive" aria-hidden="true" />
            </Button>
          </div>
        ) : null
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <StatCard label={t('lms.exams.questions')} value={quiz.questions.length} />
          <StatCard label={t('lms.exams.total_points')} value={totalPoints} />
          <StatCard label={t('lms.exams.pass_percent')} value={`${quiz.pass_percent}%`} tone="info" />
          <StatCard
            label={t('lms.exams.average')}
            value={formatPercent(quiz.average_percent)}
            tone="success"
          />
        </div>

        <Tabs value={tab} onValueChange={(value) => setTab(value === 'results' ? 'results' : 'questions')}>
          <TabsList>
            <TabsTrigger value="questions">{t('lms.exams.questions')}</TabsTrigger>
            <TabsTrigger value="results">{t('lms.exams.results')}</TabsTrigger>
          </TabsList>

          <TabsContent value="questions" className="space-y-3">
            {canManage ? (
              <div className="flex justify-end">
                <Button className="gap-2" onClick={() => setQuestion('new')}>
                  <Plus className="h-4 w-4" aria-hidden="true" /> {t('lms.questions.add')}
                </Button>
              </div>
            ) : null}
            {quiz.questions.length === 0 ? (
              <Card>
                <EmptyState
                  icon={Exam}
                  title={t('lms.questions.empty_title')}
                  description={t('lms.questions.empty_desc')}
                />
              </Card>
            ) : (
              <ol className="space-y-2">
                {quiz.questions.map((q, index) => (
                  <li key={q.id}>
                    <Card className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold tabular-nums">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="whitespace-pre-wrap font-medium">{q.text}</p>
                        {q.type !== 'text' ? (
                          <ul className="grid gap-1 text-sm sm:grid-cols-2">
                            {q.options.map((option, i) => (
                              <li
                                key={i}
                                className={
                                  q.correct.map(Number).includes(i)
                                    ? 'font-medium text-success'
                                    : 'text-muted-foreground'
                                }
                              >
                                {String.fromCharCode(65 + i)}) {option}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        <p className="text-xs text-muted-foreground">
                          {t(`lms.questions.type_${q.type}`)} ·{' '}
                          {t('lms.questions.points_short', { count: q.points })} ·{' '}
                          {t('lms.questions.correct')}: {correctLabel(q)}
                        </p>
                      </div>
                      {canManage ? (
                        <div className="flex shrink-0 gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t('common.edit')}
                            onClick={() => setQuestion(q)}
                          >
                            <PencilSimple className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t('common.delete')}
                            onClick={() => setQuestionToDelete(q)}
                          >
                            <Trash className="h-4 w-4 text-destructive" aria-hidden="true" />
                          </Button>
                        </div>
                      ) : null}
                    </Card>
                  </li>
                ))}
              </ol>
            )}
          </TabsContent>

          <TabsContent value="results" className="space-y-3">
            {results.data ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <StatCard
                  label={t('lms.exams.attempted')}
                  value={`${results.data.summary.attempted} / ${results.data.summary.expected}`}
                />
                <StatCard label={t('lms.exams.passed')} value={results.data.summary.passed} tone="success" />
                <StatCard
                  label={t('lms.exams.average')}
                  value={formatPercent(results.data.summary.average_percent)}
                  tone="info"
                />
              </div>
            ) : null}
            <Card edgeToEdge className="overflow-hidden">
              {results.isLoading ? (
                <ListLoading />
              ) : results.isError ? (
                <EmptyState title={t('lms.common.load_error')} />
              ) : (results.data?.results ?? []).length === 0 ? (
                <EmptyState
                  title={t('lms.submissions.no_students')}
                  description={t('lms.submissions.no_students_desc')}
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('lms.common.student')}</TableHead>
                      <TableHead>{t('common.status')}</TableHead>
                      <TableHead className="text-right">{t('lms.submissions.score')}</TableHead>
                      <TableHead className="hidden md:table-cell">
                        {t('lms.submissions.submitted_at')}
                      </TableHead>
                      <TableHead className="text-right">
                        <span className="sr-only">{t('common.actions')}</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(results.data?.results ?? []).map((row) => (
                      <TableRow key={row.student_id}>
                        <TableCell className="font-medium">{row.student_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <LmsStatusBadge status={row.status} />
                            {row.passed !== null ? (
                              <span className={row.passed ? 'text-xs text-success' : 'text-xs text-destructive'}>
                                {row.passed ? t('lms.exams.passed_short') : t('lms.exams.failed_short')}
                              </span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.score === null
                            ? '—'
                            : `${row.score} / ${row.max_score} (${formatPercent(row.percent)})`}
                        </TableCell>
                        <TableCell className="hidden tabular-nums md:table-cell">
                          {formatDateTime(row.submitted_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {quiz.status === 'published' && row.attempts_used < quiz.max_attempts ? (
                              <Button variant="outline" size="sm" onClick={() => setAttemptFor(row)}>
                                {t('lms.attempts.record')}
                              </Button>
                            ) : null}
                            {canManage && row.id ? (
                              <Button size="sm" variant="ghost" onClick={() => setReviewFor(row)}>
                                {t('lms.attempts.review')}
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
            {quiz.status !== 'published' ? (
              <p className="text-sm text-muted-foreground">{t('lms.exams.publish_hint')}</p>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>

      {editOpen ? <QuizFormDialog open quiz={quiz} onClose={() => setEditOpen(false)} /> : null}
      {question ? (
        <QuestionFormDialog
          key={question === 'new' ? 'new' : question.id}
          quizId={quiz.id}
          question={question === 'new' ? null : question}
          onClose={() => setQuestion(null)}
        />
      ) : null}
      {attemptFor ? (
        <RecordAttemptDialog
          quizId={quiz.id}
          questions={quiz.questions}
          student={attemptFor}
          onClose={() => setAttemptFor(null)}
        />
      ) : null}
      {reviewFor ? (
        <ReviewAttemptDialog result={reviewFor} onClose={() => setReviewFor(null)} />
      ) : null}
      <ConfirmDialog
        open={!!questionToDelete}
        onClose={() => setQuestionToDelete(null)}
        loading={removeQuestion.isPending}
        title={t('lms.questions.delete_title')}
        description={questionToDelete?.text}
        onConfirm={() =>
          questionToDelete &&
          removeQuestion.mutate(questionToDelete.id, {
            onSuccess: () => {
              toast.success(t('lms.common.deleted'));
              setQuestionToDelete(null);
            },
            onError: (error) => mutationErrorToast(error, t),
          })
        }
      />
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        loading={removeQuiz.isPending}
        title={t('lms.exams.delete_title')}
        description={t('lms.exams.delete_desc', { name: quiz.title })}
        onConfirm={() =>
          removeQuiz.mutate(quiz.id, {
            onSuccess: () => {
              toast.success(t('lms.common.deleted'));
              void navigate({ to: '/exams' });
            },
            onError: (error) => mutationErrorToast(error, t),
          })
        }
      />
    </EntityDetailShell>
  );
};

export default ExamDetailPage;
