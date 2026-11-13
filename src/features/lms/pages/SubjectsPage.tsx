import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Books, PencilSimple, Plus, Trash } from '@phosphor-icons/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ListSearchField } from '@/components/ui/ListSearchField';
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
import { mutationErrorToast } from '@/lib/mutationErrorToast';
import { useDeleteSubject, useSubjects } from '@/features/lms/api/lmsService';
import type { Subject } from '@/features/lms/types';
import { SubjectFormDialog } from '@/features/lms/components/SubjectFormDialog';
import { ListLoading } from '@/features/lms/components/LmsCommon';

const SubjectsPage = () => {
  const { t } = useTranslation();
  const canManage = useCan('manageSubjects');
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 300);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Subject | null>(null);
  const query = useSubjects({ search: debounced, limit: 200 });
  const remove = useDeleteSubject();
  const rows = query.data?.data ?? [];

  // Kategoriyalar (ota yo'q) birinchi, ostida ularning fanlari.
  const roots = rows.filter((row) => !row.parent_id || !rows.some((r) => r.id === row.parent_id));
  const ordered = roots.flatMap((root) => [
    root,
    ...rows.filter((row) => row.parent_id === root.id),
  ]);

  const openForm = (subject: Subject | null) => {
    setEditing(subject);
    setFormOpen(true);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('lms.subjects.title')}
        description={t('lms.subjects.subtitle')}
        actions={
          canManage ? (
            <Button className="gap-2" onClick={() => openForm(null)}>
              <Plus className="h-4 w-4" aria-hidden="true" /> {t('lms.subjects.add')}
            </Button>
          ) : null
        }
      />
      <div className="max-w-md">
        <ListSearchField
          value={search}
          onChange={setSearch}
          placeholder={t('lms.subjects.search_placeholder')}
        />
      </div>
      <Card edgeToEdge className="overflow-hidden">
        {query.isLoading ? (
          <ListLoading />
        ) : query.isError ? (
          <EmptyState
            icon={Books}
            title={t('lms.common.load_error')}
            action={{ label: t('common.retry'), onClick: () => void query.refetch() }}
          />
        ) : ordered.length === 0 ? (
          <EmptyState
            icon={Books}
            title={debounced ? t('common.not_found') : t('lms.subjects.empty_title')}
            description={debounced ? undefined : t('lms.subjects.empty_desc')}
            action={
              canManage && !debounced
                ? { label: t('lms.subjects.add'), onClick: () => openForm(null) }
                : undefined
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('lms.subjects.name')}</TableHead>
                <TableHead className="hidden md:table-cell">
                  {t('lms.common.description')}
                </TableHead>
                <TableHead className="text-right">{t('lms.subjects.courses_count')}</TableHead>
                <TableHead className="text-right">
                  <span className="sr-only">{t('common.actions')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordered.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className={row.parent_id ? 'flex items-center gap-2 pl-6' : 'flex items-center gap-2'}>
                      <span
                        aria-hidden="true"
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: row.color ?? 'var(--muted-foreground)' }}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{row.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.parent_id
                            ? row.parent_name
                            : t('lms.subjects.category_children', { count: row.children_count })}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden max-w-md truncate text-muted-foreground md:table-cell">
                    {row.description || '—'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{row.courses_count}</TableCell>
                  <TableCell className="text-right">
                    {canManage ? (
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t('common.edit')}
                          onClick={() => openForm(row)}
                        >
                          <PencilSimple className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t('common.delete')}
                          onClick={() => setToDelete(row)}
                        >
                          <Trash className="h-4 w-4 text-destructive" aria-hidden="true" />
                        </Button>
                      </div>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {formOpen ? (
        <SubjectFormDialog
          key={editing?.id ?? 'new'}
          open={formOpen}
          subject={editing}
          onClose={() => setFormOpen(false)}
        />
      ) : null}
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        loading={remove.isPending}
        title={t('lms.subjects.delete_title')}
        description={t('lms.subjects.delete_desc', { name: toDelete?.name ?? '' })}
        onConfirm={() =>
          toDelete &&
          remove.mutate(toDelete.id, {
            onSuccess: () => {
              toast.success(t('lms.common.deleted'));
              setToDelete(null);
            },
            onError: (error) => mutationErrorToast(error, t),
          })
        }
      />
    </div>
  );
};

export default SubjectsPage;
