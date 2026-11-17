import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';

export const Route = createFileRoute('/learner/profile')({
  component: lazyRouteComponent(
    () => import('@/features/learner/pages/LearnerProfilePage'),
    'default',
  ),
});
