import { keepPreviousData, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePermissionQuery as useQuery } from '@/hooks/usePermissionQuery';
import axiosInstance from '@/api/axiosInstance';
import { parseItemEnvelope, parseListEnvelope } from '@/lib/apiEnvelope';
import { documentKeys } from '@/lib/queryKeys';
import type {
  DocumentListFilters,
  EduDocument,
  UploadDocumentPayload,
} from '@/features/documents/types';

/** Server limiti bilan bir xil (8 MB). */
export const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024;

export const DOCUMENT_ACCEPT =
  '.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.txt';

export const fetchDocuments = async (
  filters: DocumentListFilters,
  signal?: AbortSignal,
) => {
  const { data } = await axiosInstance.get<unknown>('/documents', {
    params: {
      search: filters.search?.trim() || undefined,
      type: filters.type || undefined,
      student_id: filters.studentId || undefined,
      group_id: filters.groupId || undefined,
      page: filters.page,
      limit: filters.limit,
    },
    signal,
  });
  return parseListEnvelope<EduDocument>(data, 'documents');
};

export const useDocuments = (filters: DocumentListFilters) =>
  useQuery({
    queryKey: documentKeys.list({ ...filters }),
    queryFn: ({ signal }) => fetchDocuments(filters, signal),
    placeholderData: keepPreviousData,
  });

export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UploadDocumentPayload) => {
      const form = new FormData();
      form.append('file', payload.file);
      if (payload.title?.trim()) form.append('title', payload.title.trim());
      form.append('type', payload.type);
      if (payload.note?.trim()) form.append('note', payload.note.trim());
      if (payload.branchId) form.append('branch_id', payload.branchId);
      if (payload.studentId) form.append('student_id', payload.studentId);
      if (payload.groupId) form.append('group_id', payload.groupId);
      const { data } = await axiosInstance.post<unknown>('/documents', form);
      return parseItemEnvelope<EduDocument>(data, 'document');
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: documentKeys.all }),
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/documents/${id}`);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: documentKeys.all }),
  });
};

/** Faylni avtorizatsiya bilan olib, brauzerda yuklab beradi. */
export const downloadDocument = async (doc: EduDocument) => {
  const response = await axiosInstance.get<Blob>(
    `/documents/${doc.id}/download`,
    { responseType: 'blob' },
  );
  const url = window.URL.createObjectURL(
    new Blob([response.data], { type: doc.mime_type }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', doc.file_name);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
