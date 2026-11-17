import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';

export const Route = createFileRoute('/learner/assignments')({
  component: lazyRouteComponent(
    () => import('@/features/learner/pages/LearnerAssignmentsPage'),
    'default',
  ),
});
