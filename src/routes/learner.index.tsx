import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';

export const Route = createFileRoute('/learner/')({
  component: lazyRouteComponent(
    () => import('@/features/learner/pages/LearnerDashboardPage'),
    'default',
  ),
});
