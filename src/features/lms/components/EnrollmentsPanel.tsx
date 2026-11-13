import { useState, type FormEvent } from 'react';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { GraduationCap, Plus, UserMinus } from '@phosphor-icons/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ListSearchField } from '@/components/ui/ListSearchField';
import { StatCard } from '@/components/ui/StatCard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCan, useIsCrossTenant } from '@/hooks/useCan';
import { useDebounce } from '@/hooks/useDebounce';
import { mutationErrorToast } from '@/lib/mutationErrorToast';
import { requestBranchId } from '@/lib/permissions';
import { useAuthStore } from '@/store/authStore';
import { useGroups } from '@/features/groups/api/groupService';
import { useStudents } from '@/features/students/api/studentService';
import {
  formatPercent,
  useEnroll,
  useEnrollments,
  useUnenroll,
} from '@/features/lms/api/lmsService';
import type { Enrollment } from '@/features/lms/types';
import { FormField, ListLoading, NONE, PercentBar } from './LmsCommon';

export const EnrollmentsPanel = ({ courseId }: { courseId: string }) => {
  const { t } = useTranslation();
  const canEnroll = useCan('manageStudents');
  const query = useEnrollments(courseId);
  const unenroll = useUnenroll(courseId);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [toRemove, setToRemove] = useState<Enrollment | null>(null);
  const rows = query.data?.students ?? [];
  const summary = query.data?.summary;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label={t('lms.curriculum.enrolled')} value={summary?.enrolled ?? '—'} isLoading={query.isLoading} />
        <StatCard label={t('lms.progress.avg_progress')} value={formatPercent(summary?.average_progress)} isLoading={query.isLoading} />
        <StatCard label={t('lms.progress.avg_quiz')} value={formatPercent(summary?.average_quiz)} tone="info" isLoading={query.isLoading} />
        <StatCard label={t('lms.progress.avg_assignment')} value={formatPercent(summary?.average_assignment)} tone="success" isLoading={query.isLoading} />
      </div>
      {canEnroll ? (
        <div className="flex justify-end">
          <Button className="gap-2" onClick={() => setEnrollOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" /> {t('lms.enrollments.add')}
          </Button>
        </div>
      ) : null}
      <Card edgeToEdge className="overflow-hidden">
        {query.isLoading ? (
          <ListLoading />
        ) : query.isError ? (
          <EmptyState title={t('lms.common.load_error')} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title={t('lms.enrollments.empty_title')}
            description={t('lms.enrollments.empty_desc')}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('lms.common.student')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('lms.common.group')}</TableHead>
                <TableHead className="w-48">{t('lms.progress.lessons')}</TableHead>
                <TableHead className="hidden text-right sm:table-cell">{t('lms.progress.avg_quiz')}</TableHead>
                <TableHead className="hidden text-right sm:table-cell">{t('lms.progress.avg_assignment')}</TableHead>
                <TableHead className="text-right">
                  <span className="sr-only">{t('common.actions')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.student_id}>
                  <TableCell>
                    <Link
                      to="/students/$id"
                      params={{ id: row.student_id }}
                      className="font-medium hover:underline"
                    >
                      {row.student_name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{row.phone}</p>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {row.group_name ?? '—'}
                  </TableCell>
                  <TableCell>
                    <PercentBar value={row.progress} />
                    <p className="text-xs text-muted-foreground">
                      {row.completed_lessons} / {row.total_lessons}
                    </p>
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">
                    {formatPercent(row.quiz_average)}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">
                    {formatPercent(row.assignment_average)}
                  </TableCell>
                  <TableCell className="text-right">
                    {canEnroll ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t('lms.enrollments.remove')}
                        onClick={() => setToRemove(row)}
                      >
                        <UserMinus className="h-4 w-4 text-destructive" aria-hidden="true" />
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
      {enrollOpen ? (
        <EnrollDialog
          courseId={courseId}
          enrolledIds={rows.map((row) => row.student_id)}
          onClose={() => setEnrollOpen(false)}
        />
      ) : null}
      <ConfirmDialog
        open={!!toRemove}
        onClose={() => setToRemove(null)}
        loading={unenroll.isPending}
        title={t('lms.enrollments.remove')}
        description={t('lms.enrollments.remove_desc', { name: toRemove?.student_name ?? '' })}
        confirmLabel={t('lms.enrollments.remove')}
        onConfirm={() =>
          toRemove &&
          unenroll.mutate(toRemove.student_id, {
            onSuccess: () => {
              toast.success(t('lms.enrollments.removed'));
              setToRemove(null);
            },
            onError: (error) => mutationErrorToast(error, t),
          })
        }
      />
    </div>
  );
};

const EnrollDialog = ({
  courseId,
  enrolledIds,
  onClose,
}: {
  courseId: string;
  enrolledIds: string[];
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const enroll = useEnroll(courseId);
  const isCrossTenant = useIsCrossTenant();
  const authUser = useAuthStore((state) => state.user);
  const activeBranchId = useAuthStore((state) => state.activeBranchId);
  const branchId = isCrossTenant ? undefined : requestBranchId(authUser, activeBranchId) || undefined;
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 300);
  const [studentId, setStudentId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { data: students = [], isLoading } = useStudents(undefined, branchId, 1, 50, undefined, {
    search: debounced || undefined,
  });
  const { data: groups = [] } = useGroups();
  const courseGroups = groups.filter((group) => group.course_id === courseId);
  const candidates = students.filter((student) => !enrolledIds.includes(student.id));

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!studentId) return setError(t('lms.enrollments.student_required'));
    enroll.mutate(
      { studentId, groupId: groupId || undefined },
      {
        onSuccess: () => {
          toast.success(t('lms.enrollments.added'));
          onClose();
        },
        onError: (err) => mutationErrorToast(err, t),
      },
    );
  };

  return (
    <Dialog open onOpenChange={(next) => !next && !enroll.isPending && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('lms.enrollments.add')}</DialogTitle>
          <DialogDescription>{t('lms.enrollments.add_desc')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <ListSearchField
            value={search}
            onChange={setSearch}
            placeholder={t('lms.enrollments.search_student')}
          />
          <FormField id="enroll-student" label={t('lms.common.student')} required>
            <Select value={studentId} onValueChange={(value) => { setStudentId(value); setError(null); }}>
              <SelectTrigger id="enroll-student">
                <SelectValue
                  placeholder={isLoading ? t('common.loading') : t('common.select_placeholder')}
                />
              </SelectTrigger>
              <SelectContent>
                {candidates.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">{t('common.not_found')}</div>
                ) : (
                  candidates.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {`${student.last_name} ${student.first_name}`.trim()}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </FormField>
          <FormField
            id="enroll-group"
            label={t('lms.common.group')}
            hint={courseGroups.length ? undefined : t('lms.enrollments.no_course_groups')}
          >
            <Select value={groupId || NONE} onValueChange={(value) => setGroupId(value === NONE ? '' : value)}>
              <SelectTrigger id="enroll-group">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>{t('lms.common.not_selected')}</SelectItem>
                {courseGroups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          {error ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={enroll.isPending}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={enroll.isPending}>
              {enroll.isPending ? t('common.saving') : t('lms.enrollments.add')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
