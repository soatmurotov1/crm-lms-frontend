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
import { useSaveSubject, useSubjects } from '@/features/lms/api/lmsService';
import type { Subject } from '@/features/lms/types';
import { FormField, NONE } from './LmsCommon';

interface Props {
  open: boolean;
  subject: Subject | null;
  onClose: () => void;
}

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];

export const SubjectFormDialog = ({ open, subject, onClose }: Props) => {
  const { t } = useTranslation();
  const save = useSaveSubject();
  const { data: subjects } = useSubjects({ limit: 200 });
  const [name, setName] = useState(subject?.name ?? '');
  const [description, setDescription] = useState(subject?.description ?? '');
  const [color, setColor] = useState(subject?.color ?? COLORS[0]);
  const [parentId, setParentId] = useState(subject?.parent_id ?? '');
  const [error, setError] = useState<string | null>(null);

  const parents = (subjects?.data ?? []).filter(
    (row) => row.id !== subject?.id && !row.parent_id,
  );

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      setError(t('lms.subjects.name_required'));
      return;
    }
    save.mutate(
      {
        id: subject?.id,
        name: name.trim(),
        description: description.trim() || null,
        color,
        parent_id: parentId || null,
      },
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
    <Dialog open={open} onOpenChange={(next) => !next && !save.isPending && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {subject ? t('lms.subjects.edit') : t('lms.subjects.add')}
          </DialogTitle>
          <DialogDescription>{t('lms.subjects.form_desc')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <FormField id="subject-name" label={t('lms.subjects.name')} required>
            <Input
              id="subject-name"
              value={name}
              maxLength={120}
              aria-invalid={error ? true : undefined}
              onChange={(event) => {
                setName(event.target.value);
                setError(null);
              }}
              placeholder={t('lms.subjects.name_placeholder')}
            />
            {error ? (
              <p role="alert" className="text-sm font-medium text-destructive">
                {error}
              </p>
            ) : null}
          </FormField>
          <FormField id="subject-parent" label={t('lms.subjects.parent')}>
            <Select
              value={parentId || NONE}
              onValueChange={(value) => setParentId(value === NONE ? '' : value)}
            >
              <SelectTrigger id="subject-parent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>{t('lms.subjects.no_parent')}</SelectItem>
                {parents.map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField id="subject-description" label={t('lms.common.description')}>
            <Textarea
              id="subject-description"
              rows={3}
              maxLength={1000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </FormField>
          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium">{t('lms.subjects.color')}</legend>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={value}
                  aria-pressed={color === value}
                  onClick={() => setColor(value)}
                  className="h-11 w-11 rounded-full border-2 border-transparent p-1 aria-pressed:border-foreground"
                >
                  <span
                    className="block h-full w-full rounded-full"
                    style={{ backgroundColor: value }}
                  />
                </button>
              ))}
            </div>
          </fieldset>
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
