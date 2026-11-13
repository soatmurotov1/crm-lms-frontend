import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ClipboardText, Plus } from '@phosphor-icons/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListSearchField } from '@/components/ui/ListSearchField';
import PaginationControls from '@/components/ui/PaginationControls';
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
import { PageHeader } from '@/components/layout/PageHeader';
import { useCan } from '@/hooks/useCan';
import { useDebounce } from '@/hooks/useDebounce';
import { useAssignments } from '@/features/lms/api/lmsService';
import { AssignmentFormDialog } from '@/features/lms/components/AssignmentFormDialog';
import {
  CourseGroupSelects,
  ListLoading,
  LmsStatusBadge,
  NONE,
  formatDateTime,
} from '@/features/lms/components/LmsCommon';

const PAGE_SIZE = 20;

const AssignmentsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const canManage = useCan('manageLearning');
  const [search, setSearch] = useState('');
  const [courseId, setCourseId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const debounced = useDebounce(search, 300);
  const query = useAssignments({
    search: debounced,
    courseId,
    groupId,
    status,
    page,
    limit: PAGE_SIZE,
  });
  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;
  const filtered = !!(debounced || courseId || groupId || status);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('lms.assignments.title')}
        description={t('lms.assignments.subtitle')}
        actions={
          canManage ? (
            <Button className="gap-2" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" /> {t('lms.assignments.add')}
            </Button>
          ) : null
        }
      />
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <ListSearchField
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder={t('lms.common.search_title')}
        />
        <CourseGroupSelects
          idPrefix="assignments-filter"
          allowAll
          courseId={courseId}
          groupId={groupId}
          onCourseChange={(value) => {
            setCourseId(value);
            setGroupId('');
            setPage(1);
          }}
          onGroupChange={(value) => {
            setGroupId(value);
            setPage(1);
          }}
        />
        <Select
          value={status || NONE}
          onValueChange={(value) => {
            setStatus(value === NONE ? '' : value);
            setPage(1);
          }}
        >
          <SelectTrigger aria-label={t('common.status')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>{`${t('common.status')}: ${t('lms.common.all')}`}</SelectItem>
            {(['draft', 'published', 'closed'] as const).map((value) => (
              <SelectItem key={value} value={value}>
                {t(`lms.status.${value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card edgeToEdge className="overflow-hidden">
        {query.isLoading ? (
          <ListLoading />
        ) : query.isError ? (
          <EmptyState
            icon={ClipboardText}
            title={t('lms.common.load_error')}
            action={{ label: t('common.retry'), onClick: () => void query.refetch() }}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={ClipboardText}
            title={filtered ? t('common.not_found') : t('lms.assignments.empty_title')}
            description={filtered ? undefined : t('lms.assignments.empty_desc')}
            action={
              canManage && !filtered
                ? { label: t('lms.assignments.add'), onClick: () => setFormOpen(true) }
                : undefined
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('lms.common.title')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('lms.common.scope')}</TableHead>
                <TableHead>{t('lms.assignments.due_date')}</TableHead>
                <TableHead className="text-right">{t('lms.assignments.submitted')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => navigate({ to: '/assignments/$id', params: { id: row.id } })}
                >
                  <TableCell>
                    <button
                      type="button"
                      className="text-left font-medium hover:underline"
                      onClick={(event) => {
                        event.stopPropagation();
                        void navigate({ to: '/assignments/$id', params: { id: row.id } });
                      }}
                    >
                      {row.title}
                    </button>
                    <p className="text-xs text-muted-foreground">
                      {t('lms.assignments.max_score_short', { count: row.max_score })}
                    </p>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {[row.course_name, row.group_name].filter(Boolean).join(' · ') || '—'}
                  </TableCell>
                  <TableCell className={row.overdue ? 'text-destructive tabular-nums' : 'tabular-nums'}>
                    {formatDateTime(row.due_date)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.submissions_count}
                    <span className="text-muted-foreground"> / {row.graded_count} ✓</span>
                  </TableCell>
                  <TableCell>
                    <LmsStatusBadge status={row.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
      {meta && meta.totalPages > 1 ? (
        <PaginationControls
          currentPage={meta.page}
          totalPages={meta.totalPages}
          totalItems={meta.total}
          onPageChange={setPage}
        />
      ) : null}
      {formOpen ? (
        <AssignmentFormDialog
          open={formOpen}
          assignment={null}
          onClose={() => setFormOpen(false)}
          onSaved={(saved) =>
            void navigate({ to: '/assignments/$id', params: { id: saved.id } })
          }
        />
      ) : null}
    </div>
  );
};

export default AssignmentsPage;
