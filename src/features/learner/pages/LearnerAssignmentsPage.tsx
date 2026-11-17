import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  useLearnerAssignments,
  useSubmitAssignment,
} from '@/features/learner/api/learnerApi';
import {
  LearnerPageHeader,
  Pill,
  QueryState,
  errorMessage,
  useLearnerFormat,
  type Tone,
} from '@/features/learner/components/LearnerUi';
import type {
  LearnerAssignment,
  LearnerAssignmentStatus,
} from '@/features/learner/types';

const STATUS_TONE: Record<LearnerAssignmentStatus, Tone> = {
  pending: 'warning',
  overdue: 'danger',
  submitted: 'info',
  returned: 'warning',
  graded: 'success',
};

function AssignmentCard({ a }: { a: LearnerAssignment }) {
  const { t } = useTranslation();
  const f = useLearnerFormat();
  const submit = useSubmitAssignment();
  const [text, setText] = useState(a.submission?.text ?? '');
  const [editing, setEditing] = useState(false);
  const canSubmit = a.my_status !== 'graded';
  const showForm = canSubmit && (editing || !a.submission);

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold">{a.title}</p>
          <p className="text-xs text-muted-foreground">
            {[
              a.group_name ?? a.course_name,
              a.due_date
                ? t('learner.assignments.due', { date: f.dateTime(a.due_date) })
                : t('learner.assignments.no_due'),
              t('learner.assignments.max_score', { score: a.max_score }),
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <Pill tone={STATUS_TONE[a.my_status]}>
          {t(`learner.assignments.status.${a.my_status}`)}
        </Pill>
      </div>
      {a.description ? (
        <p className="whitespace-pre-line text-sm text-muted-foreground">
          {a.description}
        </p>
      ) : null}

      {a.submission?.score !== null && a.submission?.score !== undefined ? (
        <div className="rounded-lg bg-success/10 p-3 text-sm">
          <p className="font-semibold text-success">
            {t('learner.assignments.score', {
              score: a.submission.score,
              max: a.max_score,
            })}
          </p>
          {a.submission.feedback ? (
            <p className="mt-1">
              <span className="text-muted-foreground">
                {t('learner.assignments.feedback')}:{' '}
              </span>
              {a.submission.feedback}
            </p>
          ) : null}
        </div>
      ) : null}

      {a.submission && !showForm ? (
        <div className="rounded-lg bg-muted p-3 text-sm">
          <p className="mb-1 text-xs text-muted-foreground">
            {t('learner.assignments.answer')} ·{' '}
            {f.dateTime(a.submission.submitted_at)}
          </p>
          <p className="whitespace-pre-line break-words">{a.submission.text}</p>
          {canSubmit ? (
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={() => setEditing(true)}
            >
              {t('learner.assignments.resubmit')}
            </Button>
          ) : null}
        </div>
      ) : null}

      {showForm ? (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            submit.mutate(
              { id: a.id, text: text.trim() },
              {
                onSuccess: () => {
                  toast.success(t('learner.assignments.submitted_ok'));
                  setEditing(false);
                },
                onError: (err) =>
                  toast.error(errorMessage(err, t('learner.errors.generic'))),
              },
            );
          }}
        >
          <label className="text-sm font-medium" htmlFor={`answer-${a.id}`}>
            {t('learner.assignments.answer')}
          </label>
          <Textarea
            id={`answer-${a.id}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('learner.assignments.answer_placeholder')}
            rows={4}
          />
          <Button type="submit" disabled={submit.isPending || !text.trim()}>
            {t('learner.assignments.submit')}
          </Button>
        </form>
      ) : null}
    </Card>
  );
}

export default function LearnerAssignmentsPage() {
  const { t } = useTranslation();
  const list = useLearnerAssignments();
  return (
    <div className="space-y-6">
      <LearnerPageHeader
        title={t('learner.assignments.title')}
        subtitle={t('learner.assignments.subtitle')}
      />
      <QueryState
        isLoading={list.isLoading}
        error={list.error}
        isEmpty={!list.data?.length}
        emptyText={t('learner.assignments.empty')}
      >
        <div className="space-y-4">
          {list.data?.map((a) => (
            <AssignmentCard key={a.id} a={a} />
          ))}
        </div>
      </QueryState>
    </div>
  );
}
