import { useWriteOptions } from '@/hooks/useWriteOptions';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  useCreateCourse,
  useUpdateCourse,
} from '@/features/courses/api/courseService';
import { useSubjects } from '@/features/lms/api/lmsService';
import { Course } from '@/features/courses/types';
import { Branch } from '@/features/branches/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useConfirmedClose } from '@/hooks/useConfirmedClose';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { extractErrorMessage } from '@/lib/errors';
import { groupDigits } from '@/lib/money';

interface CourseFormDialogProps {
  open: boolean;
  editCourse: Course | null;
  branches: Branch[];
  onClose: () => void;
}

// Factory so field messages can be localized via t(), matching PersonModal's
// makePersonFormSchema convention (src/components/ui/PersonModal.tsx).
const makeCourseFormSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().trim().min(1, t('common.required')),
    branchId: z.string().trim().min(1, t('common.required')),
    courseType: z.enum(['online', 'offline']),
    price: z
      .string()
      .refine((v) => Number(v.replace(/\D/g, '')) > 0, t('common.required')),
    durationDays: z.string().refine((v) => Number(v) > 0, t('common.required')),
    subjectId: z.string().optional(),
  });

type CourseFormValues = z.infer<ReturnType<typeof makeCourseFormSchema>>;

// Extracted out of CoursesPage (was inline) so CourseDetailPage's edit
// affordance can launch the same create/edit modal the list uses --
// GroupFormDialog is the precedent for this open/editX/branches/onClose
// shape (src/features/groups/components/GroupFormDialog.tsx).
const CourseFormDialog = ({
  open,
  editCourse,
  branches,
  onClose,
}: CourseFormDialogProps) => {
  const { t } = useTranslation();
  const createMutation = useCreateCourse();
  const updateMutation = useUpdateCourse();
  const { data: subjects } = useSubjects({ limit: 200 });

  const defaultFormValues = (): CourseFormValues => ({
    name: '',
    branchId: '',
    courseType: 'offline',
    price: '',
    durationDays: '',
    subjectId: '',
  });

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(makeCourseFormSchema(t)),
    defaultValues: defaultFormValues(),
  });

  const selectedBranchId = useWatch({
    control: form.control,
    name: 'branchId',
  });
  const options = useWriteOptions(
    'courses',
    editCourse ? 'update' : 'create',
    selectedBranchId,
    open,
  );
  const branchChoices = options.scoped ? options.branches : branches;
  useEffect(() => {
    if (!open) return;
    form.reset(
      editCourse
        ? {
            name: editCourse.name,
            branchId: editCourse.branch_id,
            courseType: editCourse.course_type,
            price: groupDigits(String(editCourse.price)),
            durationDays: String(editCourse.duration_days),
            subjectId: editCourse.subject_id ?? '',
          }
        : defaultFormValues(),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editCourse]);

  const { attemptClose, confirmOpen, confirmDiscard, cancelDiscard } =
    useConfirmedClose(
      form.formState.isDirty ||
        createMutation.isPending ||
        updateMutation.isPending,
      onClose,
    );

  const onValid = (values: CourseFormValues) => {
    const payload = {
      name: values.name,
      branch_id: values.branchId,
      course_type: values.courseType,
      price: Number(values.price.replace(/\D/g, '')),
      duration_days: Number(values.durationDays),
      subject_id: values.subjectId || null,
    };
    if (editCourse) {
      updateMutation.mutate(
        { id: editCourse.id, ...payload },
        {
          onSuccess: () => {
            toast.success(t('courses.updated'));
            onClose();
          },
          onError: (err) =>
            toast.error(extractErrorMessage(err, t('common.error'))),
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success(t('courses.added'));
          onClose();
        },
        onError: (err) =>
          toast.error(extractErrorMessage(err, t('common.error'))),
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && attemptClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editCourse ? t('courses.edit') : t('courses.add')}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {t('courses.form_desc')}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onValid)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>{t('courses.name')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        aria-required="true"
                        className="bg-secondary border-border"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="branchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>{t('common.branch')}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger
                          className="bg-secondary border-border"
                          aria-required="true"
                        >
                          <SelectValue
                            placeholder={t('common.select_placeholder')}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {branchChoices.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="courseType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>{t('courses.type')}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger
                          className="bg-secondary border-border"
                          aria-required="true"
                        >
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="online">
                          {t('courses.type_online')}
                        </SelectItem>
                        <SelectItem value="offline">
                          {t('courses.type_offline')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('lms.subjects.single')}</FormLabel>
                    <Select
                      value={field.value || 'none'}
                      onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">
                          {t('lms.common.not_selected')}
                        </SelectItem>
                        {(subjects?.data ?? []).map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.parent_name
                              ? `${subject.parent_name} → ${subject.name}`
                              : subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>{t('courses.price_label')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          inputMode="numeric"
                          value={field.value}
                          onChange={(e) =>
                            field.onChange(groupDigits(e.target.value))
                          }
                          aria-required="true"
                          className="bg-secondary border-border"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="durationDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>
                        {t('courses.duration_label')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min={1}
                          onInvalid={(event) => {
                            if (
                              event.currentTarget.validity.rangeUnderflow &&
                              Number(event.currentTarget.value) <= 0
                            ) {
                              event.preventDefault();
                              void form.trigger(undefined, {
                                shouldFocus: true,
                              });
                            }
                          }}
                          inputMode="numeric"
                          aria-required="true"
                          className="bg-secondary border-border"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={attemptClose}>
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? t('common.saving')
                    : t('common.save')}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onClose={cancelDiscard}
        onConfirm={confirmDiscard}
        title={t('common.discard_changes_title')}
        description={t('common.discard_changes_desc')}
        confirmLabel={t('common.discard')}
      />
    </>
  );
};

export default CourseFormDialog;
