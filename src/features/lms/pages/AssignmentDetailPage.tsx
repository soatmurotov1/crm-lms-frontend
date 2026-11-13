import { useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  ClipboardText,
  DownloadSimple,
  PencilSimple,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCan } from '@/hooks/useCan';
import { mutationErrorToast } from '@/lib/mutationErrorToast';
import {
  downloadBlob,
  useAssignment,
  useDeleteAssignment,
  useSubmissions,
} from '@/features/lms/api/lmsService';
import type { Submission } from '@/features/lms/types';
import { AssignmentFormDialog } from '@/features/lms/components/AssignmentFormDialog';
import {
  GradeSubmissionDialog,
  RecordSubmissionDialog,
} from '@/features/lms/components/SubmissionDialogs';
import {
  ListLoading,
  LmsStatusBadge,
  formatDateTime,
} from '@/features/lms/components/LmsCommon';

const AssignmentDetailPage = () => {
  const { id } = useParams({ strict: false });
  const navigate = useNavigate();
  const { t } = useTranslation();
  const canManage = useCan('manageLearning');
  const { data: assignment, isLoading, isError } = useAssignment(id);
  const submissions = useSubmissions(id);
  const remove = useDeleteAssignment();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [recording, setRecording] = useState<Submission | null>(null);
  const [grading, setGrading] = useState<Submission | null>(null);

  if (isLoading || isError || !assignment) {
    return (
      <EntityDetailShell
        onBack={() => navigate({ to: '/assignments' })}
        backLabel={t('lms.assignments.title')}
        isLoading={isLoading}
        isError={isError || !assignment}
        errorTitle={isError ? t('common.error') : t('common.not_found')}
        errorIcon={isError ? Warning : ShieldCheck}
      />
    );
  }

  const rows = submissions.data ?? [];
  const submitted = rows.filter((row) => row.status !== 'missing').length;
  const graded = rows.filter((row) => row.status === 'graded');
  const average = graded.length
    ? Math.round(
        (graded.reduce((sum, row) => sum + (row.score ?? 0), 0) / graded.length) * 10,
      ) / 10
    : null;

  return (
    <EntityDetailShell
      onBack={() => navigate({ to: '/assignments' })}
      backLabel={t('lms.assignments.title')}
      isLoading={false}
      isError={false}
      title={assignment.title}
      description={
        <span className="text-sm text-muted-foreground">
          {[assignment.course_name, assignment.group_name].filter(Boolean).join(' · ')}
          {' · '}
          {t('lms.assignments.due_date')}: {formatDateTime(assignment.due_date)}
        </span>
      }
      meta={<LmsStatusBadge status={assignment.status} />}
      actions={
        canManage ? (
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setEditOpen(true)}>
              <PencilSimple className="h-4 w-4" aria-hidden="true" /> {t('common.edit')}
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => setDeleteOpen(true)}>
              <Trash className="h-4 w-4 text-destructive" aria-hidden="true" />
              {t('common.delete')}
            </Button>
          </div>
        ) : null
      }
    >
      <div className="space-y-4">
        {assignment.description ? (
          <Card className="whitespace-pre-wrap text-sm">{assignment.description}</Card>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label={t('lms.assignments.submitted')} value={`${submitted} / ${rows.length}`} />
          <StatCard label={t('lms.assignments.graded')} value={graded.length} tone="success" />
          <StatCard
            label={t('lms.assignments.average_score')}
            value={average === null ? '—' : `${average} / ${assignment.max_score}`}
            tone="info"
          />
        </div>
        <Card edgeToEdge className="overflow-hidden">
          {submissions.isLoading ? (
            <ListLoading />
          ) : submissions.isError ? (
            <EmptyState title={t('lms.common.load_error')} />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={ClipboardText}
              title={t('lms.submissions.no_students')}
              description={t('lms.submissions.no_students_desc')}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('lms.common.student')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t('lms.submissions.submitted_at')}
                  </TableHead>
                  <TableHead className="text-right">{t('lms.submissions.score')}</TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">{t('common.actions')}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.student_id}>
                    <TableCell>
                      <p className="font-medium">{row.student_name}</p>
                      {row.feedback ? (
                        <p className="max-w-xs truncate text-xs text-muted-foreground">
                          {row.feedback}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <LmsStatusBadge status={row.status} />
                        {row.late ? (
                          <span className="text-xs text-destructive">{t('lms.submissions.late')}</span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="hidden tabular-nums md:table-cell">
                      {formatDateTime(row.submitted_at)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.score === null ? '—' : `${row.score} / ${row.max_score}`}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {row.has_file && row.id ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t('lms.common.download')}
                            onClick={() =>
                              void downloadBlob(
                                `/submissions/${row.id}/download`,
                                row.file_name ?? 'javob',
                              ).catch((error) => mutationErrorToast(error, t))
                            }
                          >
                            <DownloadSimple className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        ) : null}
                        {assignment.status !== 'closed' ? (
                          <Button variant="outline" size="sm" onClick={() => setRecording(row)}>
                            {row.status === 'missing'
                              ? t('lms.submissions.record')
                              : t('lms.submissions.resubmit')}
                          </Button>
                        ) : null}
                        {canManage && row.id ? (
                          <Button size="sm" onClick={() => setGrading(row)}>
                            {t('lms.submissions.grade')}
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
      </div>

      {editOpen ? (
        <AssignmentFormDialog open assignment={assignment} onClose={() => setEditOpen(false)} />
      ) : null}
      {recording ? (
        <RecordSubmissionDialog
          key={recording.student_id}
          assignmentId={assignment.id}
          submission={recording}
          onClose={() => setRecording(null)}
        />
      ) : null}
      {grading ? (
        <GradeSubmissionDialog
          key={grading.student_id}
          submission={grading}
          onClose={() => setGrading(null)}
        />
      ) : null}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        loading={remove.isPending}
        title={t('lms.assignments.delete_title')}
        description={t('lms.assignments.delete_desc', { name: assignment.title })}
        onConfirm={() =>
          remove.mutate(assignment.id, {
            onSuccess: () => {
              toast.success(t('lms.common.deleted'));
              void navigate({ to: '/assignments' });
            },
            onError: (error) => mutationErrorToast(error, t),
          })
        }
      />
    </EntityDetailShell>
  );
};

export default AssignmentDetailPage;
