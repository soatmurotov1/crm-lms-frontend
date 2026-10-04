import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ClipboardText, Plus } from '@phosphor-icons/react';
import { useAuthStore } from '@/store/authStore';
import { useCan } from '@/hooks/useCan';
import { useBranches } from '@/features/branches/api/branchService';
import { useTestTemplatesPage } from '@/features/school-tests/api/schoolTestService';
import { useListQueryState } from '@/hooks/useListQueryState';
import { ListSearchField } from '@/components/ui/ListSearchField';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataCard } from '@/components/ui/DataCard';
import { EmptyState } from '@/components/ui/EmptyState';
import PaginationControls from '@/components/ui/PaginationControls';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TestTemplateFormDialog } from '@/features/school-tests/components/TestTemplateFormDialog';

const SchoolTestsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const canManage = useCan('test_templates.create');
  const canViewAll = useCan('viewAllBranches');
  const { data: branches = [] } = useBranches(canViewAll || canManage);
  const [createOpen, setCreateOpen] = useState(false);
  const {
    page,
    pageSize,
    search,
    debouncedSearch,
    setPage,
    setPageSize,
    setSearch,
  } = useListQueryState();
  const querySearch = debouncedSearch.trim() || undefined;
  const templates = useTestTemplatesPage({
    page,
    limit: pageSize,
    search: querySearch,
  });
  const isSearchPending = search.trim() !== debouncedSearch.trim();
  const isPending =
    isSearchPending || templates.isLoading || templates.isFetching;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={t('school_tests.title')}
        title={t('school_tests.title')}
        icon={<ClipboardText className="h-3.5 w-3.5" />}
        actions={
          canManage ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              {t('school_tests.create')}
            </Button>
          ) : null
        }
      />

      <ListSearchField
        value={search}
        onChange={(value) => setSearch(value.slice(0, 200))}
      />

      <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        {t('school_tests.not_official_exam')}
      </p>

      {isPending ? (
        <div
          role="status"
          aria-label={t('common.loading')}
          className="space-y-3"
        >
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : templates.isError ? (
        <div role="alert">
          <EmptyState
            icon={ClipboardText}
            title={t('common.error')}
            action={{
              label: t('common.retry'),
              onClick: () => void templates.refetch(),
            }}
          />
        </div>
      ) : !templates.data?.data.length ? (
        <EmptyState
          icon={ClipboardText}
          title={querySearch ? t('common.no_data') : t('school_tests.empty')}
          description={querySearch ? undefined : t('school_tests.empty_desc')}
        />
      ) : (
        <div className="grid gap-3">
          {templates.data.data.map((template) => (
            <DataCard
              key={template.id}
              className="cursor-pointer"
              title={template.title}
              subtitle={`${t(`school_tests.status.${template.status}`)} · ${
                template.question_count
              } ${t('school_tests.questions_short')}`}
              fields={[
                { label: 'ID', value: template.id.slice(0, 8) },
                {
                  label: t('school_tests.passing_percent'),
                  value: `${template.passing_threshold_percent}%`,
                },
                {
                  label: t('school_tests.time_limit_seconds'),
                  value: String(template.time_limit_seconds),
                },
              ]}
              onClick={() =>
                navigate({
                  to: '/school-tests/$id',
                  params: { id: template.id },
                })
              }
            />
          ))}
        </div>
      )}

      {!isPending && !templates.isError && templates.data?.meta ? (
        <PaginationControls
          currentPage={templates.data.meta.page}
          totalPages={templates.data.meta.totalPages}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          totalItems={templates.data.meta.total}
        />
      ) : null}

      {createOpen ? (
        <TestTemplateFormDialog
          open={createOpen}
          template={null}
          branches={branches}
          defaultBranchId={
            useAuthStore.getState?.()?.activeBranchId ??
            user?.branch_id ??
            undefined
          }
          onClose={() => setCreateOpen(false)}
        />
      ) : null}
    </div>
  );
};

export default SchoolTestsPage;
