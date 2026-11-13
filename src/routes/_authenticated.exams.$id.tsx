import { createFileRoute } from '@tanstack/react-router';
import { requireCapability } from '@/app/routeGuards';
import { ROUTE_CAPABILITIES } from '@/app/routeAccess';
import ExamDetailPage from '@/features/lms/pages/ExamDetailPage';

export const Route = createFileRoute('/_authenticated/exams/$id')({
  beforeLoad: ({ location }) =>
    requireCapability(location, ROUTE_CAPABILITIES['/exams/$id']),
  component: ExamDetailPage,
});
