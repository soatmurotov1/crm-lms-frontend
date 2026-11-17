export type LearnerSection =
  | 'schedule'
  | 'courses'
  | 'assignments'
  | 'quizzes'
  | 'grades'
  | 'attendance'
  | 'payments'
  | 'notifications';

export type LearnerPortalSettings = { enabled: boolean } & Record<
  LearnerSection,
  boolean
>;

export const LEARNER_SECTIONS: LearnerSection[] = [
  'schedule',
  'courses',
  'assignments',
  'quizzes',
  'grades',
  'attendance',
  'payments',
  'notifications',
];

export interface LearnerProfile {
  id: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  phone: string;
  email: string | null;
  branch_name: string | null;
  organization_name: string | null;
  created_at: string | null;
  portal: LearnerPortalSettings;
}

export interface LearnerDashboard {
  groups_count: number;
  next_lessons: {
    id: string;
    title: string;
    date: string | null;
    lesson_type: string;
    group_name: string;
    teacher_name: string | null;
  }[];
  pending_assignments: number | null;
  open_quizzes: number | null;
  attendance_percent: number | null;
  balance: { total_price: string; paid: string; debt: string } | null;
  unread_notifications: number | null;
}

export interface LearnerGroup {
  id: string;
  name: string;
  course_name: string | null;
  teacher_name: string | null;
  branch_name: string | null;
  course_type: string;
  students_count: number;
  schedule: {
    day_of_week: number;
    start_time: string;
    end_time: string;
    lesson_type: string;
  }[];
}

export type LearnerAttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface LearnerScheduleLesson {
  id: string;
  title: string;
  date: string | null;
  lesson_type: string;
  group_id: string;
  group_name: string;
  teacher_name: string | null;
  attendance: LearnerAttendanceStatus | null;
}

export interface LearnerCourse {
  id: string;
  name: string;
  description: string | null;
  modules_count: number;
  lessons_count: number;
  completed_count: number;
  total_minutes: number;
  progress: number;
}

export interface LearnerCourseDetail {
  id: string;
  name: string;
  description: string | null;
  progress: number;
  modules: {
    id: string;
    title: string;
    description: string | null;
    lessons: {
      id: string;
      title: string;
      content: string | null;
      video_url: string | null;
      duration_min: number | null;
      completed: boolean;
      materials: {
        id: string;
        title: string;
        kind: string;
        url: string | null;
        has_file: boolean;
        file_name: string | null;
      }[];
    }[];
  }[];
}

export type LearnerAssignmentStatus =
  'pending' | 'overdue' | 'submitted' | 'returned' | 'graded';

export interface LearnerAssignment {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  max_score: number;
  course_name: string | null;
  group_name: string | null;
  my_status: LearnerAssignmentStatus;
  submission: {
    text: string | null;
    score: number | null;
    feedback: string | null;
    submitted_at: string | null;
    graded_at: string | null;
  } | null;
}

export interface LearnerQuiz {
  id: string;
  title: string;
  description: string | null;
  kind: string;
  duration_min: number | null;
  pass_percent: number;
  max_attempts: number;
  starts_at: string | null;
  ends_at: string | null;
  questions_count: number;
  course_name: string | null;
  group_name: string | null;
  attempts_used: number;
  can_attempt: boolean;
  best: {
    score: number;
    max_score: number;
    percent: number;
    passed: boolean;
    status: string;
    submitted_at: string | null;
  } | null;
}

export interface LearnerQuizDetail extends LearnerQuiz {
  questions: {
    id: string;
    text: string;
    type: 'single' | 'multiple' | 'text';
    options: string[];
    points: number;
  }[];
}

export interface LearnerQuizResult {
  id: string;
  score: number;
  max_score: number;
  percent: number;
  passed: boolean;
  status: string;
  attempt_no: number;
}

export interface LearnerGrades {
  average_percent: number | null;
  items: {
    id: string;
    kind: 'assignment' | 'quiz' | 'exam';
    title: string;
    context: string | null;
    score: number;
    max_score: number;
    percent: number;
    feedback: string | null;
    date: string | null;
  }[];
}

export interface LearnerAttendance {
  summary: {
    total: number;
    present: number;
    late: number;
    absent: number;
    excused: number;
    percent: number;
  };
  items: {
    id: string;
    date: string | null;
    lesson_title: string;
    group_name: string;
    status: LearnerAttendanceStatus;
    comment: string | null;
  }[];
}

export interface LearnerPayments {
  balance: { total_price: string; paid: string; debt: string };
  items: {
    id: string;
    amount: string;
    method: string | null;
    paid_at: string | null;
    context: string | null;
  }[];
}

export interface LearnerNotifications {
  data: {
    id: string;
    title: string;
    message: string;
    type: string;
    group_name: string | null;
    created_by_name: string | null;
    created_at: string | null;
    is_read: boolean;
  }[];
  unread_count: number;
}
