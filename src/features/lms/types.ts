/** LMS (o'quv boshqaruvi) — backend `/api/v2` javoblarining shakli (snake_case). */

export interface Subject {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  parent_id: string | null;
  parent_name: string | null;
  courses_count: number;
  children_count: number;
  created_at: string;
  updated_at: string;
}

export interface SubjectPayload {
  name: string;
  description?: string | null;
  color?: string | null;
  parent_id?: string | null;
}

export type MaterialKind = 'video' | 'file' | 'link';

export interface LessonMaterial {
  id: string;
  lesson_id: string;
  title: string;
  kind: MaterialKind;
  url: string | null;
  has_file: boolean;
  file_name: string | null;
  mime_type: string | null;
  size: number | null;
  created_at: string;
}

export interface CurriculumLesson {
  id: string;
  module_id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  duration_min: number | null;
  position: number;
  materials: LessonMaterial[];
  completed_count?: number;
  completion_rate?: number;
}

export interface CurriculumModule {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  position: number;
  lessons: CurriculumLesson[];
}

export interface Curriculum {
  course_id: string;
  course_name: string;
  enrolled_count: number;
  modules_count: number;
  lessons_count: number;
  total_minutes: number;
  modules: CurriculumModule[];
}

export interface ModulePayload {
  title: string;
  description?: string | null;
}

export interface CourseLessonPayload {
  title: string;
  content?: string | null;
  video_url?: string | null;
  duration_min?: number | null;
}

export interface Enrollment {
  student_id: string;
  student_name: string;
  phone: string;
  status: string;
  group_id: string | null;
  group_name: string | null;
  completed_lessons: number;
  total_lessons: number;
  progress: number;
  assignment_average?: number | null;
  quiz_average?: number | null;
}

export type AssignmentStatus = 'draft' | 'published' | 'closed';

export interface Assignment {
  id: string;
  title: string;
  description: string | null;
  course_id: string | null;
  course_name: string | null;
  group_id: string | null;
  group_name: string | null;
  due_date: string | null;
  max_score: number;
  status: AssignmentStatus;
  overdue: boolean;
  submissions_count: number;
  graded_count: number;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssignmentPayload {
  title: string;
  description?: string | null;
  course_id?: string;
  group_id?: string;
  due_date?: string | null;
  max_score?: number;
  status?: AssignmentStatus;
}

export type SubmissionStatus = 'missing' | 'submitted' | 'graded' | 'returned';

export interface Submission {
  id: string | null;
  assignment_id: string;
  student_id: string;
  student_name: string;
  status: SubmissionStatus;
  text: string | null;
  has_file: boolean;
  file_name: string | null;
  score: number | null;
  max_score: number;
  feedback: string | null;
  late: boolean;
  submitted_at: string | null;
  graded_at: string | null;
  graded_by_name: string | null;
}

export type QuizKind = 'quiz' | 'exam';
export type QuizStatus = 'draft' | 'published' | 'closed';
export type QuestionType = 'single' | 'multiple' | 'text';

export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  kind: QuizKind;
  course_id: string | null;
  course_name: string | null;
  group_id: string | null;
  group_name: string | null;
  duration_min: number | null;
  pass_percent: number;
  max_attempts: number;
  starts_at: string | null;
  ends_at: string | null;
  status: QuizStatus;
  questions_count: number;
  attempts_count: number;
  average_percent: number | null;
  passed_count: number;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  text: string;
  type: QuestionType;
  options: string[];
  correct: (number | string)[];
  points: number;
  position: number;
}

export interface QuizDetail extends Quiz {
  questions: QuizQuestion[];
}

export interface QuizPayload {
  title: string;
  description?: string | null;
  kind?: QuizKind;
  course_id?: string;
  group_id?: string;
  duration_min?: number | null;
  pass_percent?: number;
  max_attempts?: number;
  status?: QuizStatus;
}

export interface QuestionPayload {
  text: string;
  type: QuestionType;
  options: string[];
  correct: (number | string)[];
  points: number;
}

export type AttemptAnswer = number | number[] | string;

export interface QuizResult {
  id: string | null;
  quiz_id: string;
  student_id: string;
  student_name: string;
  status: 'graded' | 'needs_review' | 'not_started';
  score: number | null;
  max_score: number | null;
  percent: number | null;
  passed: boolean | null;
  attempts_used: number;
  feedback: string | null;
  submitted_at: string | null;
}

export interface QuizResults {
  summary: {
    expected: number;
    attempted: number;
    passed: number;
    average_percent: number | null;
  };
  results: QuizResult[];
}

export interface GradeRow {
  id: string;
  source: 'assignment' | 'quiz';
  source_id: string;
  title: string;
  student_id: string;
  student_name: string;
  group_name: string | null;
  course_name: string | null;
  score: number;
  max_score: number;
  percent: number;
  passed: boolean | null;
  graded_by_name: string | null;
  date: string | null;
}

export interface StudentProgress {
  student_id: string;
  student_name: string;
  attendance: { total: number; attended: number; rate: number };
  assignments: {
    total: number;
    submitted: number;
    graded: number;
    average_percent: number | null;
  };
  quizzes: { attempted: number; passed: number; average_percent: number | null };
  courses: {
    course_id: string;
    course_name: string;
    completed_lessons: number;
    total_lessons: number;
    progress: number;
  }[];
  overall_percent: number | null;
}

export interface LmsSummary {
  subjects: number;
  courses: number;
  active_students: number;
  active_teachers: number;
  open_assignments: number;
  pending_review: number;
  published_quizzes: number;
  quiz_attempts_30d: number;
  quiz_average_30d: number | null;
  attendance_rate_30d: number | null;
  recent_results: {
    id: string;
    quiz_title: string;
    student_name: string;
    percent: number;
    passed: boolean;
    submitted_at: string | null;
  }[];
  upcoming_deadlines: {
    id: string;
    title: string;
    group_name: string | null;
    due_date: string | null;
  }[];
}

export type NotificationType =
  | 'info'
  | 'warning'
  | 'lesson'
  | 'homework'
  | 'payment'
  | 'system';
export type NotificationAudience =
  | 'all'
  | 'teachers'
  | 'students'
  | 'group'
  | 'user';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  audience: string;
  group_id: string | null;
  group_name: string | null;
  recipient_name: string | null;
  created_by_name: string | null;
  is_mine: boolean;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationPayload {
  title: string;
  message: string;
  type: NotificationType;
  audience: NotificationAudience;
  group_id?: string;
  recipient_id?: string;
}
