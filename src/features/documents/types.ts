export const DOCUMENT_TYPES = [
  'contract',
  'certificate',
  'order',
  'report',
  'other',
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export interface EduDocument {
  id: string;
  title: string;
  type: DocumentType;
  branch_id: string | null;
  branch_name: string | null;
  student_id: string | null;
  student_name: string | null;
  group_id: string | null;
  group_name: string | null;
  file_name: string;
  mime_type: string;
  size: number;
  note: string | null;
  uploaded_by_id: string;
  uploaded_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentListFilters {
  search?: string;
  type?: DocumentType;
  studentId?: string;
  groupId?: string;
  page?: number;
  limit?: number;
}

export interface UploadDocumentPayload {
  file: File;
  title?: string;
  type: DocumentType;
  note?: string;
  branchId?: string | null;
  studentId?: string;
  groupId?: string;
}
