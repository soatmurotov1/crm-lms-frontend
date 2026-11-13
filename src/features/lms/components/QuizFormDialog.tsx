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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mutationErrorToast } from '@/lib/mutationErrorToast';
import { useSaveQuiz } from '@/features/lms/api/lmsService';
import type { Quiz, QuizKind } from '@/features/lms/types';
import { CourseGroupSelects, FormField } from './LmsCommon';

interface Props {
  open: boolean;
  quiz: Quiz | null;
  onClose: () => void;
  onSaved?: (quiz: Quiz) => void;
}

const intOrNull = (value: string) => (value.trim() === '' ? null : Number(value));

export const QuizFormDialog = ({ open, quiz, onClose, onSaved }: Props) => {
  const { t } = useTranslation();
  const save = useSaveQuiz();
  const isEdit = !!quiz;
  const [title, setTitle] = useState(quiz?.title ?? '');
  const [description, setDescription] = useState(quiz?.description ?? '');
  const [kind, setKind] = useState<QuizKind>(quiz?.kind ?? 'quiz');
  const [courseId, setCourseId] = useState(quiz?.course_id ?? '');
  const [groupId, setGroupId] = useState(quiz?.group_id ?? '');
  const [duration, setDuration] = useState(quiz?.duration_min ? String(quiz.duration_min) : '');
  const [passPercent, setPassPercent] = useState(String(quiz?.pass_percent ?? 60));
  const [maxAttempts, setMaxAttempts] = useState(String(quiz?.max_attempts ?? 1));
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return setError(t('lms.common.title_required'));
    if (!isEdit && !courseId && !groupId) return setError(t('lms.common.scope_required'));
    const pass = Number(passPercent);
    const attempts = Number(maxAttempts);
    const minutes = intOrNull(duration);
    if (!Number.isInteger(pass) || pass < 0 || pass > 100)
      return setError(t('lms.exams.pass_invalid'));
    if (!Number.isInteger(attempts) || attempts < 1 || attempts > 20)
      return setError(t('lms.exams.attempts_invalid'));
    if (minutes !== null && (!Number.isInteger(minutes) || minutes < 1 || minutes > 600))
      return setError(t('lms.exams.duration_invalid'));
    setError(null);
    save.mutate(
      {
        id: quiz?.id,
        title: title.trim(),
        description: description.trim() || null,
        duration_min: minutes,
        pass_percent: pass,
        max_attempts: attempts,
        ...(isEdit
          ? {}
          : { kind, course_id: courseId || undefined, group_id: groupId || undefined }),
      },
      {
        onSuccess: (saved) => {
          toast.success(t('lms.common.saved'));
          onSaved?.(saved);
          onClose();
        },
        onError: (err) => mutationErrorToast(err, t),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !save.isPending && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('lms.exams.edit') : t('lms.exams.add')}</DialogTitle>
          <DialogDescription>{t('lms.exams.form_desc')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <FormField id="quiz-title" label={t('lms.common.title')} required>
            <Input
              id="quiz-title"
              value={title}
              maxLength={200}
              onChange={(event) => setTitle(event.target.value)}
            />
          </FormField>
          {!isEdit ? (
            <>
              <FormField id="quiz-kind" label={t('lms.exams.kind')}>
                <Select value={kind} onValueChange={(value) => setKind(value as QuizKind)}>
                  <SelectTrigger id="quiz-kind">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quiz">{t('lms.exams.kind_quiz')}</SelectItem>
                    <SelectItem value="exam">{t('lms.exams.kind_exam')}</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <div className="space-y-1.5">
                <p className="text-sm font-medium">
                  {t('lms.common.scope')} <span className="text-destructive">*</span>
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <CourseGroupSelects
                    idPrefix="quiz"
                    courseId={courseId}
                    groupId={groupId}
                    onCourseChange={(value) => {
                      setCourseId(value);
                      setGroupId('');
                    }}
                    onGroupChange={setGroupId}
                  />
                </div>
              </div>
            </>
          ) : null}
          <FormField id="quiz-description" label={t('lms.common.description')}>
            <Textarea
              id="quiz-description"
              rows={3}
              maxLength={5000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-3">
            <FormField id="quiz-duration" label={t('lms.exams.duration')}>
              <Input
                id="quiz-duration"
                type="number"
                min={1}
                max={600}
                value={duration}
                placeholder="—"
                onChange={(event) => setDuration(event.target.value)}
              />
            </FormField>
            <FormField id="quiz-pass" label={t('lms.exams.pass_percent')}>
              <Input
                id="quiz-pass"
                type="number"
                min={0}
                max={100}
                value={passPercent}
                onChange={(event) => setPassPercent(event.target.value)}
              />
            </FormField>
            <FormField id="quiz-attempts" label={t('lms.exams.max_attempts')}>
              <Input
                id="quiz-attempts"
                type="number"
                min={1}
                max={20}
                value={maxAttempts}
                onChange={(event) => setMaxAttempts(event.target.value)}
              />
            </FormField>
          </div>
          {error ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={save.isPending}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
