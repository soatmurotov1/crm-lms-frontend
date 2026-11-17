import axios from 'axios';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { useLearnerStore } from '@/features/learner/api/learnerStore';
import type {
  LearnerAssignment,
  LearnerAttendance,
  LearnerCourse,
  LearnerCourseDetail,
  LearnerDashboard,
  LearnerGrades,
  LearnerGroup,
  LearnerNotifications,
  LearnerPayments,
  LearnerProfile,
  LearnerQuiz,
  LearnerQuizDetail,
  LearnerQuizResult,
  LearnerScheduleLesson,
  LearnerPortalSettings,
} from '@/features/learner/types';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4040/api/v2';

/**
 * O'quvchi kabineti uchun alohida axios: xodim tokeni va xodimning 401
 * ishlovchisi bu yerga aralashmaydi (sessiya `learner_session` cookie'sida).
 */
export const learnerHttp = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 30_000,
});

learnerHttp.interceptors.request.use((config) => {
  const token = useLearnerStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

learnerHttp.interceptors.response.use(
  (res) => res,
  (error) => {
    const url: string = error.config?.url ?? '';
    if (
      error.response?.status === 401 &&
      !/\/learner\/auth\/(login|me)/.test(url)
    ) {
      useLearnerStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

const get = async <T>(url: string, params?: Record<string, unknown>) =>
  (await learnerHttp.get<{ data: T }>(url, { params })).data.data;

export const learnerKeys = {
  all: ['learner'] as const,
  me: ['learner', 'me'] as const,
  dashboard: ['learner', 'dashboard'] as const,
  groups: ['learner', 'groups'] as const,
  schedule: (from: string, to: string) =>
    ['learner', 'schedule', from, to] as const,
  courses: ['learner', 'courses'] as const,
  course: (id: string) => ['learner', 'courses', id] as const,
  assignments: ['learner', 'assignments'] as const,
  quizzes: ['learner', 'quizzes'] as const,
  quiz: (id: string) => ['learner', 'quizzes', id] as const,
  grades: ['learner', 'grades'] as const,
  attendance: ['learner', 'attendance'] as const,
  payments: ['learner', 'payments'] as const,
  notifications: ['learner', 'notifications'] as const,
};

// --- Kirish ------------------------------------------------------------------

export const learnerLogin = async (phone: string, password: string) => {
  const { data } = await learnerHttp.post<{
    data: { token: string; user: LearnerProfile };
  }>('/learner/auth/login', { phone, password });
  return data.data;
};

export const fetchLearnerMe = () => get<LearnerProfile>('/learner/auth/me');

export const learnerLogoutRequest = () =>
  learnerHttp.post('/learner/auth/logout').catch(() => undefined);

export const useLearnerChangePassword = () =>
  useMutation({
    mutationFn: (dto: { currentPassword: string; newPassword: string }) =>
      learnerHttp.post('/learner/auth/change-password', dto),
  });

// --- Ma'lumotlar ---------------------------------------------------------------

type Opts<T> = Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>;

export const useLearnerDashboard = () =>
  useQuery({
    queryKey: learnerKeys.dashboard,
    queryFn: () => get<LearnerDashboard>('/learner/dashboard'),
  });

export const useLearnerGroups = () =>
  useQuery({
    queryKey: learnerKeys.groups,
    queryFn: () => get<LearnerGroup[]>('/learner/groups'),
  });

export const useLearnerSchedule = (from: string, to: string) =>
  useQuery({
    queryKey: learnerKeys.schedule(from, to),
    queryFn: () =>
      get<LearnerScheduleLesson[]>('/learner/schedule', {
        date_from: from,
        date_to: to,
      }),
  });

export const useLearnerCourses = () =>
  useQuery({
    queryKey: learnerKeys.courses,
    queryFn: () => get<LearnerCourse[]>('/learner/courses'),
  });

export const useLearnerCourse = (id: string) =>
  useQuery({
    queryKey: learnerKeys.course(id),
    queryFn: () => get<LearnerCourseDetail>(`/learner/courses/${id}`),
  });

export const useLearnerAssignments = () =>
  useQuery({
    queryKey: learnerKeys.assignments,
    queryFn: () => get<LearnerAssignment[]>('/learner/assignments'),
  });

export const useLearnerQuizzes = () =>
  useQuery({
    queryKey: learnerKeys.quizzes,
    queryFn: () => get<LearnerQuiz[]>('/learner/quizzes'),
  });

export const useLearnerQuiz = (id: string, opts?: Opts<LearnerQuizDetail>) =>
  useQuery({
    queryKey: learnerKeys.quiz(id),
    queryFn: () => get<LearnerQuizDetail>(`/learner/quizzes/${id}`),
    ...opts,
  });

export const useLearnerGrades = () =>
  useQuery({
    queryKey: learnerKeys.grades,
    queryFn: () => get<LearnerGrades>('/learner/grades'),
  });

export const useLearnerAttendance = () =>
  useQuery({
    queryKey: learnerKeys.attendance,
    queryFn: () => get<LearnerAttendance>('/learner/attendance'),
  });

export const useLearnerPayments = () =>
  useQuery({
    queryKey: learnerKeys.payments,
    queryFn: () => get<LearnerPayments>('/learner/payments'),
  });

export const useLearnerNotifications = () =>
  useQuery({
    queryKey: learnerKeys.notifications,
    queryFn: async () =>
      (await learnerHttp.get<LearnerNotifications>('/learner/notifications'))
        .data,
  });

// --- Amallar -------------------------------------------------------------------

export const useToggleLessonProgress = (courseId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      lessonId,
      completed,
    }: {
      lessonId: string;
      completed: boolean;
    }) =>
      learnerHttp.post(`/learner/lessons/${lessonId}/progress`, { completed }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: learnerKeys.course(courseId) });
      void qc.invalidateQueries({ queryKey: learnerKeys.courses });
    },
  });
};

export const useSubmitAssignment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      learnerHttp.post(`/learner/assignments/${id}/submit`, { text }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: learnerKeys.assignments });
      void qc.invalidateQueries({ queryKey: learnerKeys.dashboard });
    },
  });
};

export const useSubmitQuiz = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (answers: Record<string, number | number[] | string>) =>
      (
        await learnerHttp.post<{ data: LearnerQuizResult }>(
          `/learner/quizzes/${id}/attempts`,
          { answers },
        )
      ).data.data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: learnerKeys.quizzes });
      void qc.invalidateQueries({ queryKey: learnerKeys.grades });
      void qc.invalidateQueries({ queryKey: learnerKeys.dashboard });
    },
  });
};

export const useMarkNotificationsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id?: string) =>
      learnerHttp.post(
        id
          ? `/learner/notifications/${id}/read`
          : '/learner/notifications/read-all',
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: learnerKeys.notifications });
      void qc.invalidateQueries({ queryKey: learnerKeys.dashboard });
    },
  });
};

export const materialDownloadUrl = (id: string) =>
  `${API_BASE_URL}/learner/materials/${id}/download`;

export type { LearnerPortalSettings };
