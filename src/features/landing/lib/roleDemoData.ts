import {
  Bell,
  BookOpen,
  Calendar,
  ChartBar,
  ClipboardText,
  Exam,
  Wallet,
  type Icon,
} from '@phosphor-icons/react';

export type DemoLearnerSection =
  | 'schedule'
  | 'courses'
  | 'assignments'
  | 'quizzes'
  | 'grades'
  | 'payments'
  | 'notifications';

export const DEMO_LEARNER_SECTIONS: {
  id: DemoLearnerSection;
  label: string;
  icon: Icon;
}[] = [
  { id: 'schedule', label: 'Dars jadvali', icon: Calendar },
  { id: 'courses', label: 'Kurslar', icon: BookOpen },
  { id: 'assignments', label: 'Topshiriqlar', icon: ClipboardText },
  { id: 'quizzes', label: 'Testlar', icon: Exam },
  { id: 'grades', label: 'Baholar', icon: ChartBar },
  { id: 'payments', label: 'To‘lovlar', icon: Wallet },
  { id: 'notifications', label: 'Xabarlar', icon: Bell },
];

export type LearnerToggles = Record<DemoLearnerSection, boolean>;

export const DEFAULT_LEARNER_TOGGLES: LearnerToggles = {
  schedule: true,
  courses: true,
  assignments: true,
  quizzes: true,
  grades: true,
  payments: true,
  notifications: true,
};
