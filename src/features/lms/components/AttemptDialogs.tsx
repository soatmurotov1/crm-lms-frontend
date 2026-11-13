import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { mutationErrorToast } from '@/lib/mutationErrorToast';
import { useReviewAttempt, useSubmitAttempt } from '@/features/lms/api/lmsService';
import type { AttemptAnswer, QuizQuestion, QuizResult } from '@/features/lms/types';
import { FormField } from './LmsCommon';

interface AttemptProps {
  quizId: string;
  questions: QuizQuestion[];
  student: QuizResult;
  onClose: () => void;
}

/** O'quvchi javoblarini kiritish (qog'ozdagi test yoki og'zaki imtihon). */
export const RecordAttemptDialog = ({ quizId, questions, student, onClose }: AttemptProps) => {
  const { t } = useTranslation();
  const submit = useSubmitAttempt(quizId);
  const [answers, setAnswers] = useState<Record<string, AttemptAnswer>>({});

  const setAnswer = (id: string, value: AttemptAnswer) =>
    setAnswers((prev) => ({ ...prev, [id]: value }));

  const toggleMulti = (id: string, index: number) => {
    const current = Array.isArray(answers[id]) ? (answers[id] as number[]) : [];
    setAnswer(
      id,
      current.includes(index) ? current.filter((i) => i !== index) : [...current, index],
    );
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit.mutate(
      { studentId: student.student_id, answers },
      {
        onSuccess: (response) => {
          const data = (response as { data?: { data?: QuizResult } }).data?.data;
          toast.success(
            data
              ? t('lms.attempts.result_toast', {
                  score: data.score,
                  max: data.max_score,
                  percent: data.percent,
                })
              : t('lms.common.saved'),
          );
          onClose();
        },
        onError: (err) => mutationErrorToast(err, t),
      },
    );
  };

  return (
    <Dialog open onOpenChange={(next) => !next && !submit.isPending && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('lms.attempts.record')}</DialogTitle>
          <DialogDescription>{student.student_name}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-5">
          {questions.map((question, qIndex) => (
            <fieldset key={question.id} className="space-y-2 rounded-lg border border-border p-3">
              <legend className="px-1 text-sm font-medium">
                {qIndex + 1}. {question.text}{' '}
                <span className="font-normal text-muted-foreground">
                  ({t('lms.questions.points_short', { count: question.points })})
                </span>
              </legend>
              {question.type === 'text' ? (
                <Input
                  aria-label={t('lms.attempts.answer_n', { n: qIndex + 1 })}
                  value={typeof answers[question.id] === 'string' ? (answers[question.id] as string) : ''}
                  onChange={(event) => setAnswer(question.id, event.target.value)}
                />
              ) : (
                question.options.map((option, index) => (
                  <label key={index} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2 hover:bg-muted/50">
                    <input
                      type={question.type === 'single' ? 'radio' : 'checkbox'}
                      name={`q-${question.id}`}
                      className="h-5 w-5 accent-[var(--primary)]"
                      checked={
                        question.type === 'single'
                          ? answers[question.id] === index
                          : Array.isArray(answers[question.id]) &&
                            (answers[question.id] as number[]).includes(index)
                      }
                      onChange={() =>
                        question.type === 'single'
                          ? setAnswer(question.id, index)
                          : toggleMulti(question.id, index)
                      }
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))
              )}
            </fieldset>
          ))}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submit.isPending}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={submit.isPending}>
              {submit.isPending ? t('common.saving') : t('lms.attempts.submit')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const ReviewAttemptDialog = ({
  result,
  onClose,
}: {
  result: QuizResult;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const review = useReviewAttempt();
  const [score, setScore] = useState(String(result.score ?? 0));
  const [feedback, setFeedback] = useState(result.feedback ?? '');
  const [error, setError] = useState<string | null>(null);
  const max = result.max_score ?? 0;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = Number(score);
    if (!result.id || Number.isNaN(value) || value < 0 || value > max) {
      setError(t('lms.submissions.score_invalid', { max }));
      return;
    }
    review.mutate(
      { attemptId: result.id, score: value, feedback },
      {
        onSuccess: () => {
          toast.success(t('lms.common.saved'));
          onClose();
        },
        onError: (err) => mutationErrorToast(err, t),
      },
    );
  };

  return (
    <Dialog open onOpenChange={(next) => !next && !review.isPending && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('lms.attempts.review')}</DialogTitle>
          <DialogDescription>{result.student_name}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <FormField id="review-score" label={t('lms.submissions.score_of', { max })} required>
            <Input
              id="review-score"
              type="number"
              min={0}
              max={max}
              step="0.5"
              value={score}
              onChange={(event) => {
                setScore(event.target.value);
                setError(null);
              }}
            />
          </FormField>
          <FormField id="review-feedback" label={t('lms.submissions.feedback')}>
            <Textarea
              id="review-feedback"
              rows={3}
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
            />
          </FormField>
          {error ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={review.isPending}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={review.isPending}>
              {review.isPending ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
