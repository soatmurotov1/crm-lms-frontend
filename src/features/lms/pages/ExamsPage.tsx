import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Exam, Plus } from '@phosphor-icons/react';
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
import { formatPercent, useQuizzes } from '@/features/lms/api/lmsService';
import { QuizFormDialog } from '@/features/lms/components/QuizFormDialog';
import {
  CourseGroupSelects,
  ListLoading,
  LmsStatusBadge,
  NONE,
} from '@/features/lms/components/LmsCommon';

const PAGE_SIZE = 20;

const ExamsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const canManage = useCan('manageLearning');
  const [search, setSearch] = useState('');
  const [courseId, setCourseId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [kind, setKind] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const debounced = useDebounce(search, 300);
  const query = useQuizzes({ search: debounced, courseId, groupId, kind, page, limit: PAGE_SIZE });
  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;
  const filtered = !!(debounced || courseId || groupId || kind);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('lms.exams.title')}
        description={t('lms.exams.subtitle')}
        actions={
          canManage ? (
            <Button className="gap-2" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" /> {t('lms.exams.add')}
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
          idPrefix="exams-filter"
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
          value={kind || NONE}
          onValueChange={(value) => {
            setKind(value === NONE ? '' : value);
            setPage(1);
          }}
        >
          <SelectTrigger aria-label={t('lms.exams.kind')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>{`${t('lms.exams.kind')}: ${t('lms.common.all')}`}</SelectItem>
            <SelectItem value="quiz">{t('lms.exams.kind_quiz')}</SelectItem>
            <SelectItem value="exam">{t('lms.exams.kind_exam')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card edgeToEdge className="overflow-hidden">
        {query.isLoading ? (
          <ListLoading />
        ) : query.isError ? (
          <EmptyState
            icon={Exam}
            title={t('lms.common.load_error')}
            action={{ label: t('common.retry'), onClick: () => void query.refetch() }}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Exam}
            title={filtered ? t('common.not_found') : t('lms.exams.empty_title')}
            description={filtered ? undefined : t('lms.exams.empty_desc')}
            action={
              canManage && !filtered
                ? { label: t('lms.exams.add'), onClick: () => setFormOpen(true) }
                : undefined
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('lms.common.title')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('lms.common.scope')}</TableHead>
                <TableHead className="text-right">{t('lms.exams.questions')}</TableHead>
                <TableHead className="text-right">{t('lms.exams.attempts')}</TableHead>
                <TableHead className="text-right">{t('lms.exams.average')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => navigate({ to: '/exams/$id', params: { id: row.id } })}
                >
                  <TableCell>
                    <button
                      type="button"
                      className="text-left font-medium hover:underline"
                      onClick={(event) => {
                        event.stopPropagation();
                        void navigate({ to: '/exams/$id', params: { id: row.id } });
                      }}
                    >
                      {row.title}
                    </button>
                    <p className="text-xs text-muted-foreground">
                      {t(`lms.exams.kind_${row.kind}`)} · {t('lms.exams.pass_short', { count: row.pass_percent })}
                    </p>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {[row.course_name, row.group_name].filter(Boolean).join(' · ') || '—'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{row.questions_count}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.attempts_count}
                    <span className="text-muted-foreground"> / {row.passed_count} ✓</span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPercent(row.average_percent)}
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
        <QuizFormDialog
          open
          quiz={null}
          onClose={() => setFormOpen(false)}
          onSaved={(saved) => void navigate({ to: '/exams/$id', params: { id: saved.id } })}
        />
      ) : null}
    </div>
  );
};

export default ExamsPage;
