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
import { useSaveAssignment } from '@/features/lms/api/lmsService';
import type { Assignment, AssignmentStatus } from '@/features/lms/types';
import {
  CourseGroupSelects,
  FormField,
  fromLocalInput,
  toLocalInput,
} from './LmsCommon';

interface Props {
  open: boolean;
  assignment: Assignment | null;
  onClose: () => void;
  onSaved?: (assignment: Assignment) => void;
}

const STATUSES: AssignmentStatus[] = ['draft', 'published', 'closed'];

export const AssignmentFormDialog = ({ open, assignment, onClose, onSaved }: Props) => {
  const { t } = useTranslation();
  const save = useSaveAssignment();
  const [title, setTitle] = useState(assignment?.title ?? '');
  const [description, setDescription] = useState(assignment?.description ?? '');
  const [courseId, setCourseId] = useState(assignment?.course_id ?? '');
  const [groupId, setGroupId] = useState(assignment?.group_id ?? '');
  const [dueDate, setDueDate] = useState(toLocalInput(assignment?.due_date));
  const [maxScore, setMaxScore] = useState(String(assignment?.max_score ?? 100));
  const [status, setStatus] = useState<AssignmentStatus>(assignment?.status ?? 'published');
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!assignment;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const score = Number(maxScore);
    if (!title.trim()) return setError(t('lms.common.title_required'));
    if (!isEdit && !courseId && !groupId) return setError(t('lms.common.scope_required'));
    if (!Number.isInteger(score) || score < 1 || score > 1000)
      return setError(t('lms.assignments.max_score_invalid'));
    setError(null);
    save.mutate(
      {
        id: assignment?.id,
        title: title.trim(),
        description: description.trim() || null,
        due_date: fromLocalInput(dueDate),
        max_score: score,
        status,
        ...(isEdit ? {} : { course_id: courseId || undefined, group_id: groupId || undefined }),
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
          <DialogTitle>
            {isEdit ? t('lms.assignments.edit') : t('lms.assignments.add')}
          </DialogTitle>
          <DialogDescription>{t('lms.assignments.form_desc')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <FormField id="assignment-title" label={t('lms.common.title')} required>
            <Input
              id="assignment-title"
              value={title}
              maxLength={200}
              onChange={(event) => setTitle(event.target.value)}
            />
          </FormField>
          {!isEdit ? (
            <div className="space-y-1.5">
              <p className="text-sm font-medium">
                {t('lms.common.scope')} <span className="text-destructive">*</span>
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <CourseGroupSelects
                  idPrefix="assignment"
                  courseId={courseId}
                  groupId={groupId}
                  onCourseChange={(value) => {
                    setCourseId(value);
                    setGroupId('');
                  }}
                  onGroupChange={setGroupId}
                />
              </div>
              <p className="text-xs text-muted-foreground">{t('lms.common.scope_hint')}</p>
            </div>
          ) : null}
          <FormField id="assignment-description" label={t('lms.common.description')}>
            <Textarea
              id="assignment-description"
              rows={4}
              maxLength={10000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-3">
            <FormField id="assignment-due" label={t('lms.assignments.due_date')}>
              <Input
                id="assignment-due"
                type="datetime-local"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </FormField>
            <FormField id="assignment-max" label={t('lms.assignments.max_score')} required>
              <Input
                id="assignment-max"
                type="number"
                min={1}
                max={1000}
                value={maxScore}
                onChange={(event) => setMaxScore(event.target.value)}
              />
            </FormField>
            <FormField id="assignment-status" label={t('common.status')}>
              <Select value={status} onValueChange={(value) => setStatus(value as AssignmentStatus)}>
                <SelectTrigger id="assignment-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(`lms.status.${value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
