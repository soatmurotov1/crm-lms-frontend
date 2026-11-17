import {
  createFileRoute,
  lazyRouteComponent,
  redirect,
} from '@tanstack/react-router';
import { useLearnerStore } from '@/features/learner/api/learnerStore';

// O'quvchi kabineti — xodimlar panelidan alohida, o'z sessiyasi bilan.
export const Route = createFileRoute('/learner')({
  beforeLoad: () => {
    if (!useLearnerStore.getState().isAuthenticated) {
      throw redirect({ href: '/login?as=student', replace: true });
    }
  },
  component: lazyRouteComponent(
    () => import('@/features/learner/pages/LearnerLayout'),
    'LearnerLayout',
  ),
});
