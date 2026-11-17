import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';

export const Route = createFileRoute('/learner/courses/')({
  component: lazyRouteComponent(
    () => import('@/features/learner/pages/LearnerCoursesPages'),
    'LearnerCoursesPage',
  ),
});
