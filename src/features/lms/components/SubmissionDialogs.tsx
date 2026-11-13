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
import {
  MATERIAL_ACCEPT,
  MAX_LMS_FILE_BYTES,
  useGradeSubmission,
  useRecordSubmission,
} from '@/features/lms/api/lmsService';
import type { Submission } from '@/features/lms/types';
import { FormField } from './LmsCommon';

interface RecordProps {
  assignmentId: string;
  submission: Submission | null;
  onClose: () => void;
}

/** Xodim o'quvchi javobini qayd etadi (matn va/yoki fayl). */
export const RecordSubmissionDialog = ({ assignmentId, submission, onClose }: RecordProps) => {
  const { t } = useTranslation();
  const record = useRecordSubmission(assignmentId);
  const [text, setText] = useState(submission?.text ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!submission) return;
    if (!text.trim() && !file) return setError(t('lms.submissions.answer_required'));
    if (file && file.size > MAX_LMS_FILE_BYTES) return setError(t('lms.common.file_too_large'));
    record.mutate(
      { studentId: submission.student_id, text, file },
      {
        onSuccess: () => {
          toast.success(t('lms.submissions.recorded'));
          onClose();
        },
        onError: (err) => mutationErrorToast(err, t),
      },
    );
  };

  return (
    <Dialog open={!!submission} onOpenChange={(next) => !next && !record.isPending && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('lms.submissions.record')}</DialogTitle>
          <DialogDescription>{submission?.student_name}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <FormField id="submission-text" label={t('lms.submissions.answer')}>
            <Textarea
              id="submission-text"
              rows={5}
              maxLength={20000}
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
          </FormField>
          <FormField id="submission-file" label={t('lms.common.file')} hint={t('lms.common.file_hint')}>
            <Input
              id="submission-file"
              type="file"
              accept={MATERIAL_ACCEPT}
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </FormField>
          {error ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={record.isPending}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={record.isPending}>
              {record.isPending ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

interface GradeProps {
  submission: Submission | null;
  onClose: () => void;
}

export const GradeSubmissionDialog = ({ submission, onClose }: GradeProps) => {
  const { t } = useTranslation();
  const grade = useGradeSubmission();
  const [score, setScore] = useState(
    submission?.score !== null && submission?.score !== undefined ? String(submission.score) : '',
  );
  const [feedback, setFeedback] = useState(submission?.feedback ?? '');
  const [error, setError] = useState<string | null>(null);

  const submit = (status: 'graded' | 'returned') => {
    if (!submission?.id) return;
    const value = Number(score);
    if (score === '' || !Number.isInteger(value) || value < 0 || value > submission.max_score) {
      setError(t('lms.submissions.score_invalid', { max: submission.max_score }));
      return;
    }
    grade.mutate(
      { submissionId: submission.id, score: value, feedback, status },
      {
        onSuccess: () => {
          toast.success(t('lms.submissions.graded'));
          onClose();
        },
        onError: (err) => mutationErrorToast(err, t),
      },
    );
  };

  return (
    <Dialog open={!!submission} onOpenChange={(next) => !next && !grade.isPending && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('lms.submissions.grade')}</DialogTitle>
          <DialogDescription>{submission?.student_name}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit('graded');
          }}
          className="space-y-4"
        >
          {submission?.text ? (
            <div className="max-h-48 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-3 text-sm">
              {submission.text}
            </div>
          ) : null}
          <FormField
            id="grade-score"
            label={t('lms.submissions.score_of', { max: submission?.max_score ?? 0 })}
            required
          >
            <Input
              id="grade-score"
              type="number"
              min={0}
              max={submission?.max_score}
              value={score}
              aria-invalid={error ? true : undefined}
              onChange={(event) => {
                setScore(event.target.value);
                setError(null);
              }}
            />
          </FormField>
          <FormField id="grade-feedback" label={t('lms.submissions.feedback')}>
            <Textarea
              id="grade-feedback"
              rows={3}
              maxLength={5000}
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
            />
          </FormField>
          {error ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={grade.isPending}>
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={grade.isPending}
              onClick={() => submit('returned')}
            >
              {t('lms.submissions.return')}
            </Button>
            <Button type="submit" disabled={grade.isPending}>
              {grade.isPending ? t('common.saving') : t('lms.submissions.grade')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
