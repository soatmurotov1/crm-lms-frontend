import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';

export const Route = createFileRoute('/learner/grades')({
  component: lazyRouteComponent(
    () => import('@/features/learner/pages/LearnerRecordsPages'),
    'LearnerGradesPage',
  ),
});
