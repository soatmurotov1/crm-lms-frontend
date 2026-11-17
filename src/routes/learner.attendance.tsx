import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';

export const Route = createFileRoute('/learner/attendance')({
  component: lazyRouteComponent(
    () => import('@/features/learner/pages/LearnerRecordsPages'),
    'LearnerAttendancePage',
  ),
});
