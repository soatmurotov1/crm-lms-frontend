import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { DownloadSimple, FileText, Plus, Trash } from '@phosphor-icons/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ListSearchField } from '@/components/ui/ListSearchField';
import PaginationControls from '@/components/ui/PaginationControls';
import { Skeleton } from '@/components/ui/skeleton';
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
import { mutationErrorToast } from '@/lib/mutationErrorToast';
import { formatDate } from '@/shared/lib/studentsFormat';
import {
  downloadDocument,
  formatFileSize,
  useDeleteDocument,
  useDocuments,
} from '@/features/documents/api/documentService';
import { UploadDocumentDialog } from '@/features/documents/components/UploadDocumentDialog';
import {
  DOCUMENT_TYPES,
  type DocumentType,
  type EduDocument,
} from '@/features/documents/types';

const PAGE_SIZE = 20;

const DocumentsPage = () => {
  const { t } = useTranslation();
  const canCreate = useCan('documents.create');
  const canDelete = useCan('documents.delete');
  const [search, setSearch] = useState('');
  const [type, setType] = useState<DocumentType | 'all'>('all');
  const [page, setPage] = useState(1);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [toDelete, setToDelete] = useState<EduDocument | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  const query = useDocuments({
    search: debouncedSearch,
    type: type === 'all' ? undefined : type,
    page,
    limit: PAGE_SIZE,
  });
  const deleteMutation = useDeleteDocument();
  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;
  const filtered = Boolean(debouncedSearch.trim()) || type !== 'all';

  const onDownload = async (doc: EduDocument) => {
    setDownloadingId(doc.id);
    try {
      await downloadDocument(doc);
    } catch (error) {
      mutationErrorToast(error, t);
    } finally {
      setDownloadingId(null);
    }
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    deleteMutation.mutate(toDelete.id, {
      onSuccess: () => {
        toast.success(t('documents.deleted'));
        setToDelete(null);
      },
      onError: (error) => mutationErrorToast(error, t),
    });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('documents.title')}
        description={t('documents.subtitle')}
        icon={<FileText className="h-3.5 w-3.5" aria-hidden="true" />}
        actions={
          canCreate ? (
            <Button className="gap-2" onClick={() => setUploadOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" /> {t('documents.add')}
            </Button>
          ) : null
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[14rem] flex-1">
          <ListSearchField
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder={t('documents.search_placeholder')}
          />
        </div>
        <Select
          value={type}
          onValueChange={(value) => {
            setType(value as DocumentType | 'all');
            setPage(1);
          }}
        >
          <SelectTrigger
            className="h-10 w-48 border-border bg-secondary"
            aria-label={t('documents.doc_type')}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('documents.all_types')}</SelectItem>
            {DOCUMENT_TYPES.map((value) => (
              <SelectItem key={value} value={value}>
                {t(`documents.types.${value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card edgeToEdge className="overflow-hidden">
        {query.isLoading ? (
          <div className="space-y-2 p-4" role="status" aria-busy="true">
            <span className="sr-only">{t('common.loading')}</span>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : query.isError ? (
          <EmptyState
            icon={FileText}
            title={t('documents.load_error')}
            action={{ label: t('common.retry'), onClick: () => void query.refetch() }}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={filtered ? t('documents.not_found') : t('documents.empty_title')}
            description={filtered ? undefined : t('documents.empty_desc')}
            action={
              canCreate && !filtered
                ? { label: t('documents.add'), onClick: () => setUploadOpen(true) }
                : undefined
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('documents.name')}</TableHead>
                <TableHead>{t('documents.doc_type')}</TableHead>
                <TableHead className="hidden md:table-cell">
                  {t('documents.branch')}
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  {t('documents.uploaded_by')}
                </TableHead>
                <TableHead>{t('documents.date')}</TableHead>
                <TableHead className="text-right">
                  <span className="sr-only">{t('common.actions')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{doc.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {doc.file_name} · {formatFileSize(doc.size)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{t(`documents.types.${doc.type}`)}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {doc.branch_name ?? t('documents.company_wide')}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {doc.uploaded_by_name}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatDate(doc.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t('documents.download')}
                        disabled={downloadingId === doc.id}
                        onClick={() => void onDownload(doc)}
                      >
                        <DownloadSimple className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      {canDelete ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t('common.delete')}
                          onClick={() => setToDelete(doc)}
                        >
                          <Trash className="h-4 w-4 text-destructive" aria-hidden="true" />
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

      {meta && meta.totalPages > 1 ? (
        <PaginationControls
          currentPage={meta.page}
          totalPages={meta.totalPages}
          totalItems={meta.total}
          onPageChange={setPage}
        />
      ) : null}

      <UploadDocumentDialog open={uploadOpen} onClose={() => setUploadOpen(false)} />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleteMutation.isPending}
        title={t('documents.delete_title')}
        description={t('documents.delete_desc', { name: toDelete?.title ?? '' })}
      />
    </div>
  );
};

export default DocumentsPage;
