import type {
  CreateCourseRequest,
  UpdateCourseRequest,
} from '@/shared/api/contract';

export interface Course {
  id: string;
  name: string;
  branch_id: string;
  branch_name?: string;
  course_type: 'online' | 'offline';
  price: number;
  duration_days: number;
  is_active: boolean;
  created_at: string;
  /** LMS fani / kategoriyasi. */
  subject_id?: string | null;
  subject_name?: string | null;
}

export type CreateCoursePayload = CreateCourseRequest;
export type UpdateCoursePayload = UpdateCourseRequest;
