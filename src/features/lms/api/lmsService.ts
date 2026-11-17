import { useContext } from 'react';
import {
  QueryClientContext,
  keepPreviousData,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { queryClient as appQueryClient } from '@/lib/queryClient';
import { usePermissionQuery as useQuery } from '@/hooks/usePermissionQuery';
import axiosInstance from '@/api/axiosInstance';
import { parseItemEnvelope, parseListEnvelope } from '@/lib/apiEnvelope';
import {
  assignmentKeys,
  courseKeys,
  curriculumKeys,
  enrollmentKeys,
  examKeys,
  gradeKeys,
  lmsKeys,
  notificationKeys,
  progressKeys,
  subjectKeys,
} from '@/lib/queryKeys';
import type {
  Assignment,
  AssignmentPayload,
  AttemptAnswer,
  CourseLessonPayload,
  Curriculum,
  Enrollment,
  GradeRow,
  LessonMaterial,
  LmsSummary,
  MaterialKind,
  ModulePayload,
  NotificationItem,
  NotificationPayload,
  QuestionPayload,
  Quiz,
  QuizDetail,
  QuizPayload,
  QuizResults,
  StudentProgress,
  Subject,
  SubjectPayload,
  Submission,
} from '@/features/lms/types';

/** Server limiti bilan bir xil (8 MB). */
export const MAX_LMS_FILE_BYTES = 8 * 1024 * 1024;
export const MATERIAL_ACCEPT =
  '.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.mp4,.mp3';

const clean = <T extends Record<string, unknown>>(params: T) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== '' && value !== null,
    ),
  );

interface ListFilters {
  search?: string;
  page?: number;
  limit?: number;
}

// --- Fanlar -----------------------------------------------------------------

/** Provider bo'lmagan joyda (masalan, izolyatsiyalangan forma testida) ilova klienti. */
const useFallbackClient = () => useContext(QueryClientContext) ?? appQueryClient;

export const useSubjects = (filters: ListFilters & { parentId?: string } = {}) => {
  const client = useFallbackClient();
  return useQuery(
    {
      queryKey: subjectKeys.list({ ...filters }),
      queryFn: async ({ signal }) => {
        const { data } = await axiosInstance.get<unknown>('/subjects', {
          params: clean({
            search: filters.search?.trim(),
            parent_id: filters.parentId,
            page: filters.page,
            limit: filters.limit ?? 100,
          }),
          signal,
        });
        return parseListEnvelope<Subject>(data, 'subjects');
      },
      placeholderData: keepPreviousData,
    },
    client,
  );
};

export const useSaveSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: SubjectPayload & { id?: string }) => {
      const { data } = id
        ? await axiosInstance.patch<unknown>(`/subjects/${id}`, payload)
        : await axiosInstance.post<unknown>('/subjects', payload);
      return parseItemEnvelope<Subject>(data, 'subject');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: subjectKeys.all }),
  });
};

export const useDeleteSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/subjects/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: subjectKeys.all }),
  });
};

// --- O'quv dasturi ------------------------------------------------------------

export const useCurriculum = (courseId: string | undefined, enabled = true) =>
  useQuery({
    queryKey: curriculumKeys.detail(courseId),
    queryFn: async ({ signal }) => {
      const { data } = await axiosInstance.get<unknown>(
        `/courses/${courseId}/curriculum`,
        { signal },
      );
      return parseItemEnvelope<Curriculum>(data, 'curriculum');
    },
    enabled: !!courseId && enabled,
  });

const useCurriculumMutation = <TVars>(
  mutationFn: (vars: TVars) => Promise<unknown>,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: curriculumKeys.all });
      void queryClient.invalidateQueries({ queryKey: enrollmentKeys.all });
    },
  });
};

export const useSaveModule = (courseId: string) =>
  useCurriculumMutation(
    ({ id, ...payload }: ModulePayload & { id?: string }) =>
      id
        ? axiosInstance.patch(`/modules/${id}`, payload)
        : axiosInstance.post(`/courses/${courseId}/modules`, payload),
  );

export const useDeleteModule = () =>
  useCurriculumMutation((id: string) => axiosInstance.delete(`/modules/${id}`));

export const useSaveCourseLesson = () =>
  useCurriculumMutation(
    ({
      id,
      moduleId,
      ...payload
    }: CourseLessonPayload & { id?: string; moduleId: string }) =>
      id
        ? axiosInstance.patch(`/course-lessons/${id}`, payload)
        : axiosInstance.post(`/modules/${moduleId}/lessons`, payload),
  );

export const useDeleteCourseLesson = () =>
  useCurriculumMutation((id: string) =>
    axiosInstance.delete(`/course-lessons/${id}`),
  );

export interface MaterialPayload {
  lessonId: string;
  kind: MaterialKind;
  title?: string;
  url?: string;
  file?: File | null;
}

export const useAddMaterial = () =>
  useCurriculumMutation(async (payload: MaterialPayload) => {
    if (payload.file) {
      const form = new FormData();
      form.append('kind', payload.kind);
      if (payload.title?.trim()) form.append('title', payload.title.trim());
      form.append('file', payload.file);
      const { data } = await axiosInstance.post<unknown>(
        `/course-lessons/${payload.lessonId}/materials`,
        form,
      );
      return parseItemEnvelope<LessonMaterial>(data, 'material');
    }
    const { data } = await axiosInstance.post<unknown>(
      `/course-lessons/${payload.lessonId}/materials`,
      clean({ kind: payload.kind, title: payload.title?.trim(), url: payload.url }),
    );
    return parseItemEnvelope<LessonMaterial>(data, 'material');
  });

export const useDeleteMaterial = () =>
  useCurriculumMutation((id: string) => axiosInstance.delete(`/materials/${id}`));

export const useMarkLessonProgress = () =>
  useCurriculumMutation(
    (vars: { lessonId: string; studentId: string; completed: boolean }) =>
      axiosInstance.post(`/course-lessons/${vars.lessonId}/progress`, {
        student_id: vars.studentId,
        completed: vars.completed,
      }),
  );

/** Faylni avtorizatsiya bilan olib, brauzerda yuklab beradi. */
export const downloadBlob = async (path: string, fileName: string) => {
  const response = await axiosInstance.get<Blob>(path, { responseType: 'blob' });
  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// --- Kursga yozilish ---------------------------------------------------------

export const useEnrollments = (courseId: string | undefined, enabled = true) =>
  useQuery({
    queryKey: enrollmentKeys.detail(courseId),
    queryFn: async ({ signal }) => {
      const { data } = await axiosInstance.get<unknown>(
        `/courses/${courseId}/progress`,
        { signal },
      );
      return parseItemEnvelope<{
        students: Enrollment[];
        summary: {
          enrolled: number;
          average_progress: number | null;
          average_quiz: number | null;
          average_assignment: number | null;
        };
      }>(data, 'course progress');
    },
    enabled: !!courseId && enabled,
  });

const useEnrollmentMutation = <TVars>(
  mutationFn: (vars: TVars) => Promise<unknown>,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: enrollmentKeys.all });
      void queryClient.invalidateQueries({ queryKey: curriculumKeys.all });
      void queryClient.invalidateQueries({ queryKey: courseKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
};

export const useEnroll = (courseId: string) =>
  useEnrollmentMutation((vars: { studentId: string; groupId?: string }) =>
    axiosInstance.post(
      `/courses/${courseId}/enrollments`,
      clean({ student_id: vars.studentId, group_id: vars.groupId }),
    ),
  );

export const useUnenroll = (courseId: string) =>
  useEnrollmentMutation((studentId: string) =>
    axiosInstance.delete(`/courses/${courseId}/enrollments/${studentId}`),
  );

// --- Topshiriqlar ----------------------------------------------------------------

export interface AssignmentFilters extends ListFilters {
  courseId?: string;
  groupId?: string;
  status?: string;
}

export const useAssignments = (filters: AssignmentFilters) =>
  useQuery({
    queryKey: assignmentKeys.page({ ...filters }),
    queryFn: async ({ signal }) => {
      const { data } = await axiosInstance.get<unknown>('/assignments', {
        params: clean({
          search: filters.search?.trim(),
          course_id: filters.courseId,
          group_id: filters.groupId,
          status: filters.status,
          page: filters.page,
          limit: filters.limit,
        }),
        signal,
      });
      return parseListEnvelope<Assignment>(data, 'assignments');
    },
    placeholderData: keepPreviousData,
  });

export const useAssignment = (id: string | undefined) =>
  useQuery({
    queryKey: assignmentKeys.detail(id),
    queryFn: async ({ signal }) => {
      const { data } = await axiosInstance.get<unknown>(`/assignments/${id}`, {
        signal,
      });
      return parseItemEnvelope<Assignment>(data, 'assignment');
    },
    enabled: !!id,
  });

export const useSubmissions = (id: string | undefined) =>
  useQuery({
    queryKey: assignmentKeys.submissions(id),
    queryFn: async ({ signal }) => {
      const { data } = await axiosInstance.get<unknown>(
        `/assignments/${id}/submissions`,
        { signal },
      );
      return parseListEnvelope<Submission>(data, 'submissions').data;
    },
    enabled: !!id,
  });

const useAssignmentMutation = <TVars, TResult = unknown>(
  mutationFn: (vars: TVars) => Promise<TResult>,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: assignmentKeys.all });
      void queryClient.invalidateQueries({ queryKey: gradeKeys.all });
      void queryClient.invalidateQueries({ queryKey: progressKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['lms'] });
    },
  });
};

export const useSaveAssignment = () =>
  useAssignmentMutation(
    async ({ id, ...payload }: AssignmentPayload & { id?: string }) => {
      const { data } = id
        ? await axiosInstance.patch<unknown>(`/assignments/${id}`, payload)
        : await axiosInstance.post<unknown>('/assignments', clean(payload));
      return parseItemEnvelope<Assignment>(data, 'assignment');
    },
  );

export const useDeleteAssignment = () =>
  useAssignmentMutation((id: string) => axiosInstance.delete(`/assignments/${id}`));

export const useRecordSubmission = (assignmentId: string) =>
  useAssignmentMutation(
    async (vars: { studentId: string; text?: string; file?: File | null }) => {
      if (vars.file) {
        const form = new FormData();
        form.append('student_id', vars.studentId);
        if (vars.text?.trim()) form.append('text', vars.text.trim());
        form.append('file', vars.file);
        await axiosInstance.post(`/assignments/${assignmentId}/submissions`, form);
        return;
      }
      await axiosInstance.post(`/assignments/${assignmentId}/submissions`, {
        student_id: vars.studentId,
        text: vars.text,
      });
    },
  );

export const useGradeSubmission = () =>
  useAssignmentMutation(
    (vars: {
      submissionId: string;
      score: number;
      feedback?: string;
      status?: 'graded' | 'returned';
    }) =>
      axiosInstance.patch(`/submissions/${vars.submissionId}/grade`, {
        score: vars.score,
        feedback: vars.feedback || undefined,
        status: vars.status,
      }),
  );

// --- Testlar va imtihonlar ----------------------------------------------------------

export interface QuizFilters extends AssignmentFilters {
  kind?: string;
}

export const useQuizzes = (filters: QuizFilters) =>
  useQuery({
    queryKey: examKeys.page({ ...filters }),
    queryFn: async ({ signal }) => {
      const { data } = await axiosInstance.get<unknown>('/exams', {
        params: clean({
          search: filters.search?.trim(),
          course_id: filters.courseId,
          group_id: filters.groupId,
          status: filters.status,
          kind: filters.kind,
          page: filters.page,
          limit: filters.limit,
        }),
        signal,
      });
      return parseListEnvelope<Quiz>(data, 'exams');
    },
    placeholderData: keepPreviousData,
  });

export const useQuiz = (id: string | undefined) =>
  useQuery({
    queryKey: examKeys.detail(id),
    queryFn: async ({ signal }) => {
      const { data } = await axiosInstance.get<unknown>(`/exams/${id}`, { signal });
      return parseItemEnvelope<QuizDetail>(data, 'exam');
    },
    enabled: !!id,
  });

export const useQuizResults = (id: string | undefined) =>
  useQuery({
    queryKey: examKeys.results(id),
    queryFn: async ({ signal }) => {
      const { data } = await axiosInstance.get<unknown>(`/exams/${id}/results`, {
        signal,
      });
      return parseItemEnvelope<QuizResults>(data, 'exam results');
    },
    enabled: !!id,
  });

const useQuizMutation = <TVars, TResult = unknown>(
  mutationFn: (vars: TVars) => Promise<TResult>,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: examKeys.all });
      void queryClient.invalidateQueries({ queryKey: gradeKeys.all });
      void queryClient.invalidateQueries({ queryKey: progressKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['lms'] });
    },
  });
};

export const useSaveQuiz = () =>
  useQuizMutation(async ({ id, ...payload }: Partial<QuizPayload> & { id?: string }) => {
    const { data } = id
      ? await axiosInstance.patch<unknown>(`/exams/${id}`, payload)
      : await axiosInstance.post<unknown>('/exams', clean(payload));
    return parseItemEnvelope<Quiz>(data, 'exam');
  });

export const useDeleteQuiz = () =>
  useQuizMutation((id: string) => axiosInstance.delete(`/exams/${id}`));

export const useSaveQuestion = (quizId: string) =>
  useQuizMutation(({ id, ...payload }: QuestionPayload & { id?: string }) =>
    id
      ? axiosInstance.put(`/exams/${quizId}/questions/${id}`, payload)
      : axiosInstance.post(`/exams/${quizId}/questions`, payload),
  );

export const useDeleteQuestion = (quizId: string) =>
  useQuizMutation((id: string) =>
    axiosInstance.delete(`/exams/${quizId}/questions/${id}`),
  );

export const useSubmitAttempt = (quizId: string) =>
  useQuizMutation(
    (vars: { studentId: string; answers: Record<string, AttemptAnswer> }) =>
      axiosInstance.post(`/exams/${quizId}/attempts`, {
        student_id: vars.studentId,
        answers: vars.answers,
      }),
  );

export const useReviewAttempt = () =>
  useQuizMutation((vars: { attemptId: string; score: number; feedback?: string }) =>
    axiosInstance.patch(`/exam-attempts/${vars.attemptId}/review`, {
      score: vars.score,
      feedback: vars.feedback || undefined,
    }),
  );

// --- Baholar, progress, dashboard -------------------------------------------------------

export interface GradeFilters {
  studentId?: string;
  groupId?: string;
  courseId?: string;
  source?: 'assignment' | 'quiz';
  page?: number;
  limit?: number;
}

export const useGrades = (filters: GradeFilters) =>
  useQuery({
    queryKey: gradeKeys.page({ ...filters }),
    queryFn: async ({ signal }) => {
      const { data } = await axiosInstance.get<{
        summary?: { count: number; average_percent: number | null };
      }>('/grades', {
        params: clean({
          student_id: filters.studentId,
          group_id: filters.groupId,
          course_id: filters.courseId,
          source: filters.source,
          page: filters.page,
          limit: filters.limit,
        }),
        signal,
      });
      return {
        ...parseListEnvelope<GradeRow>(data, 'grades'),
        summary: data.summary ?? { count: 0, average_percent: null },
      };
    },
    placeholderData: keepPreviousData,
  });

export const useStudentProgress = (studentId: string | undefined, enabled = true) =>
  useQuery({
    queryKey: progressKeys.detail(studentId),
    queryFn: async ({ signal }) => {
      const { data } = await axiosInstance.get<unknown>(
        `/progress/students/${studentId}`,
        { signal },
      );
      return parseItemEnvelope<StudentProgress>(data, 'progress');
    },
    enabled: !!studentId && enabled,
  });

export const useLmsSummary = (enabled = true) =>
  useQuery({
    queryKey: lmsKeys.summary(),
    queryFn: async ({ signal }) => {
      const { data } = await axiosInstance.get<{ data: LmsSummary | null }>(
        '/lms/summary',
        { signal },
      );
      return data.data;
    },
    enabled,
    staleTime: 60_000,
  });

// --- Bildirishnomalar -------------------------------------------------------------

export const useNotifications = (filters: { unread?: boolean; page?: number; limit?: number }) =>
  useQuery({
    queryKey: notificationKeys.page({ ...filters }),
    queryFn: async ({ signal }) => {
      const { data } = await axiosInstance.get<{ unread_count?: number }>(
        '/notifications',
        {
          params: clean({
            unread: filters.unread ? 'true' : undefined,
            page: filters.page,
            limit: filters.limit,
          }),
          signal,
        },
      );
      return {
        ...parseListEnvelope<NotificationItem>(data, 'notifications'),
        unread_count: data.unread_count ?? 0,
      };
    },
    placeholderData: keepPreviousData,
  });

export const useUnreadNotifications = (enabled = true) =>
  useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: async ({ signal }) => {
      const { data } = await axiosInstance.get<{ data: { unread_count: number } }>(
        '/notifications/unread-count',
        { signal },
      );
      return data.data.unread_count;
    },
    enabled,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

const useNotificationMutation = <TVars>(
  mutationFn: (vars: TVars) => Promise<unknown>,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
};

export const useSendNotification = () =>
  useNotificationMutation((payload: NotificationPayload) =>
    axiosInstance.post('/notifications', clean({ ...payload })),
  );

export const useMarkNotificationRead = () =>
  useNotificationMutation((id: string) =>
    axiosInstance.patch(`/notifications/${id}/read`),
  );

export const useMarkAllNotificationsRead = () =>
  useNotificationMutation(() => axiosInstance.post('/notifications/read-all'));

export const useDeleteNotification = () =>
  useNotificationMutation((id: string) =>
    axiosInstance.delete(`/notifications/${id}`),
  );

export const formatPercent = (value: number | null | undefined) =>
  value === null || value === undefined ? '—' : `${Math.round(value * 10) / 10}%`;
