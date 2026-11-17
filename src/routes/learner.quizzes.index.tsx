import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';

export const Route = createFileRoute('/learner/quizzes/')({
  component: lazyRouteComponent(
    () => import('@/features/learner/pages/LearnerQuizzesPages'),
    'LearnerQuizzesPage',
  ),
});
