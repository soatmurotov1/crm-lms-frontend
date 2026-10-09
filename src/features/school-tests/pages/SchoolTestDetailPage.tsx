import { StatCard } from '@/components/ui/StatCard';
import { useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ClipboardText } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useCan } from '@/hooks/useCan';
import { useBranches } from '@/features/branches/api/branchService';
import {
  usePublishTestTemplate,
  useTemplateAssignments,
  useTestTemplate,
} from '@/features/school-tests/api/schoolTestService';
import {
  assignmentWindowStatus,
  type AssignmentWindowStatus,
} from '@/features/school-tests/types';
import { EntityDetailShell } from '@/components/ui/EntityDetailShell';
import { Button } from '@/components/ui/button';
import { DataCard } from '@/components/ui/DataCard';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { extractErrorMessage } from '@/lib/errors';
import { formatTashkentDateTime } from '@/lib/calendarDateTime';
import { TestTemplateFormDialog } from '@/features/school-tests/components/TestTemplateFormDialog';
import { AssignTestDialog } from '@/features/school-tests/components/AssignTestDialog';
import { QuestionPreview } from '@/shared/ui/QuestionPreview';
import { useQuestion } from '@/features/questions/api/questionService';
import { activeQuestionVersion } from '@/features/questions/types';

const PreviewQuestion = ({ questionId }: { questionId: string }) => {
  const { t } = useTranslation();
  const { data: question } = useQuestion(questionId);
  const version = question ? activeQuestionVersion(question) : null;
  if (!question || !version) {
    return (
      <p className="text-xs text-muted-foreground">{t('common.loading')}</p>
    );
  }
  return (
    <QuestionPreview
      question={question}
      version={version}
      locale="uz"
      revealAnswer
    />
  );
};

const windowTone = (status: AssignmentWindowStatus) => {
  if (status === 'open') return 'text-success';
  if (status === 'scheduled') return 'text-warning';
  return 'text-muted-foreground';
};

const SchoolTestDetailPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams({ from: '/_authenticated/school-tests/$id' });
  const canManage = useCan('test_templates.update');
  const mayPublish = useCan('tests.publish');
  const mayAssign = useCan('tests.assign');
  const { data: template, isLoading } = useTestTemplate(id);
  const assignments = useTemplateAssignments(id);
  const { data: branches = [] } = useBranches(canManage);
  const publish = usePublishTestTemplate();
  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);

  if (isLoading || !template) {
    return (
      <EntityDetailShell
        onBack={() => void navigate({ to: '/school-tests' })}
        backLabel={t('school_tests.back')}
        isLoading={isLoading}
        isError={!template}
        errorTitle={t('common.not_found')}
      />
    );
  }

  const canPublish = mayPublish && template.status === 'draft';
  const canAssign = mayAssign && template.status === 'published';

  return (
    <EntityDetailShell
      onBack={() => void navigate({ to: '/school-tests' })}
      backLabel={t('school_tests.back')}
      isLoading={false}
      isError={false}
      title={template.title}
      description={`${t(`school_tests.status.${template.status}`)} · ${t(
        'school_tests.not_official_exam',
      )}`}
      meta={
        <>
          <ClipboardText className="h-3.5 w-3.5" />
          {t('school_tests.title')}
        </>
      }
      actions={
        canManage || canPublish || canAssign ? (
          <div className="flex flex-wrap gap-2">
            {canManage && (
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                {t('school_tests.edit')}
              </Button>
            )}
            {canPublish ? (
              <Button
                onClick={() =>
                  publish.mutate(template.id, {
                    onSuccess: () => toast.success(t('school_tests.published')),
                    onError: (e: Error) =>
                      toast.error(extractErrorMessage(e, t('common.error'))),
                  })
                }
                disabled={publish.isPending}
              >
                {t('school_tests.publish')}
              </Button>
            ) : null}
            {canAssign ? (
              <Button onClick={() => setAssignOpen(true)}>
                {t('school_tests.assign')}
              </Button>
            ) : null}
          </div>
        ) : null
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t('school_tests.question_count')}
          value={template.question_count}
        />
        <StatCard
          label={t('school_tests.time_limit_seconds')}
          value={template.time_limit_seconds}
        />
        <StatCard
          label={t('school_tests.passing_percent')}
          value={`${template.passing_threshold_percent}%`}
        />
        <StatCard
          label={t('school_tests.review_timing')}
          value={t(`school_tests.review.${template.answer_review_timing}`)}
        />
      </div>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">
          {t('school_tests.preview_questions')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('school_tests.preview_hint')}
        </p>
        <div className="flex flex-wrap gap-2">
          {(template.questions ?? []).map((item) => (
            <Button
              key={item.question_id}
              size="sm"
              variant={previewId === item.question_id ? 'default' : 'outline'}
              onClick={() => setPreviewId(item.question_id)}
            >
              #{item.sort_order + 1}
            </Button>
          ))}
        </div>
        {previewId ? <PreviewQuestion questionId={previewId} /> : null}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">
          {t('school_tests.assignments_outcomes')}
        </h2>
        <p className="rounded-md bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          {t('school_tests.outcomes_separate_from_exams')}
        </p>
        {assignments.isLoading ? (
          <Card>
            <div className="space-y-3" role="status" aria-busy="true">
              <span className="sr-only">{t('common.loading')}</span>
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </Card>
        ) : !assignments.data?.length ? (
          <Card>
            <EmptyState
              icon={ClipboardText}
              title={t('school_tests.no_assignments')}
              description={t('school_tests.no_assignments_desc')}
            />
          </Card>
        ) : (
          <div className="grid gap-3">
            {assignments.data.map((assignment) => {
              const windowStatus = assignmentWindowStatus(assignment);
              return (
                <DataCard
                  key={assignment.id}
                  title={
                    assignment.group_id
                      ? t('school_tests.group_assignment')
                      : t('school_tests.student_assignment')
                  }
                  subtitle={
                    <span className={windowTone(windowStatus)}>
                      {t(`school_tests.window.${windowStatus}`)}
                    </span>
                  }
                  fields={[
                    {
                      label: t('school_tests.target_id'),
                      value:
                        assignment.group_id ?? assignment.student_id ?? '—',
                    },
                    {
                      label: t('school_tests.available_from'),
                      value: assignment.available_from
                        ? formatTashkentDateTime(
                            assignment.available_from,
                            i18n.language,
                          )
                        : '—',
                    },
                    {
                      label: t('school_tests.available_until'),
                      value: assignment.available_until
                        ? formatTashkentDateTime(
                            assignment.available_until,
                            i18n.language,
                          )
                        : '—',
                    },
                  ]}
                />
              );
            })}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {t('school_tests.analytics_pending')}
        </p>
      </section>

      {editOpen ? (
        <TestTemplateFormDialog
          open={editOpen}
          template={template}
          branches={branches}
          onClose={() => setEditOpen(false)}
        />
      ) : null}
      {assignOpen ? (
        <AssignTestDialog
          open={assignOpen}
          templateId={template.id}
          branchId={template.branch_id}
          onClose={() => setAssignOpen(false)}
        />
      ) : null}
    </EntityDetailShell>
  );
};

export default SchoolTestDetailPage;
