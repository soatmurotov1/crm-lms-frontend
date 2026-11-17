import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';

export const Route = createFileRoute('/learner/schedule')({
  component: lazyRouteComponent(
    () => import('@/features/learner/pages/LearnerSchedulePage'),
    'default',
  ),
});
