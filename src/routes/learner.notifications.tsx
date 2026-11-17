import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';

export const Route = createFileRoute('/learner/notifications')({
  component: lazyRouteComponent(
    () => import('@/features/learner/pages/LearnerRecordsPages'),
    'LearnerNotificationsPage',
  ),
});
