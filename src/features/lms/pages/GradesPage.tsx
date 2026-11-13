import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ChartBar } from '@phosphor-icons/react';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/EmptyState';
import PaginationControls from '@/components/ui/PaginationControls';
import { StatCard } from '@/components/ui/StatCard';
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
import { formatPercent, useGrades } from '@/features/lms/api/lmsService';
import {
  CourseGroupSelects,
  ListLoading,
  NONE,
  PercentBar,
  formatDateTime,
} from '@/features/lms/components/LmsCommon';

const PAGE_SIZE = 50;

const GradesPage = () => {
  const { t } = useTranslation();
  const [courseId, setCourseId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [source, setSource] = useState<'' | 'assignment' | 'quiz'>('');
  const [page, setPage] = useState(1);
  const query = useGrades({
    courseId,
    groupId,
    source: source || undefined,
    page,
    limit: PAGE_SIZE,
  });
  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;
  const summary = query.data?.summary;

  return (
    <div className="space-y-4">
      <PageHeader title={t('lms.grades.title')} description={t('lms.grades.subtitle')} />
      <div className="grid gap-2 sm:grid-cols-3">
        <CourseGroupSelects
          idPrefix="grades-filter"
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
          value={source || NONE}
          onValueChange={(value) => {
            setSource(value === NONE ? '' : (value as 'assignment' | 'quiz'));
            setPage(1);
          }}
        >
          <SelectTrigger aria-label={t('lms.grades.source')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>{`${t('lms.grades.source')}: ${t('lms.common.all')}`}</SelectItem>
            <SelectItem value="assignment">{t('lms.grades.source_assignment')}</SelectItem>
            <SelectItem value="quiz">{t('lms.grades.source_quiz')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard label={t('lms.grades.count')} value={summary?.count ?? '—'} isLoading={query.isLoading} />
        <StatCard
          label={t('lms.grades.average')}
          value={formatPercent(summary?.average_percent)}
          tone="info"
          isLoading={query.isLoading}
        />
      </div>
      <Card edgeToEdge className="overflow-hidden">
        {query.isLoading ? (
          <ListLoading />
        ) : query.isError ? (
          <EmptyState
            icon={ChartBar}
            title={t('lms.common.load_error')}
            action={{ label: t('common.retry'), onClick: () => void query.refetch() }}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={ChartBar}
            title={t('lms.grades.empty_title')}
            description={t('lms.grades.empty_desc')}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('lms.common.student')}</TableHead>
                <TableHead>{t('lms.grades.work')}</TableHead>
                <TableHead className="hidden lg:table-cell">{t('lms.common.scope')}</TableHead>
                <TableHead className="text-right">{t('lms.submissions.score')}</TableHead>
                <TableHead className="hidden w-48 md:table-cell">{t('lms.grades.percent')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('common.date')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Link
                      to="/students/$id"
                      params={{ id: row.student_id }}
                      className="font-medium hover:underline"
                    >
                      {row.student_name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      to={row.source === 'quiz' ? '/exams/$id' : '/assignments/$id'}
                      params={{ id: row.source_id }}
                      className="hover:underline"
                    >
                      {row.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {t(`lms.grades.source_${row.source}`)}
                    </p>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {[row.course_name, row.group_name].filter(Boolean).join(' · ') || '—'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.score} / {row.max_score}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <PercentBar value={row.percent} />
                  </TableCell>
                  <TableCell className="hidden tabular-nums md:table-cell">
                    {formatDateTime(row.date)}
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
    </div>
  );
};

export default GradesPage;
