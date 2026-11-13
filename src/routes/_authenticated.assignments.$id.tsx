import { createFileRoute } from '@tanstack/react-router';
import { requireCapability } from '@/app/routeGuards';
import { ROUTE_CAPABILITIES } from '@/app/routeAccess';
import AssignmentDetailPage from '@/features/lms/pages/AssignmentDetailPage';

export const Route = createFileRoute('/_authenticated/assignments/$id')({
  beforeLoad: ({ location }) =>
    requireCapability(location, ROUTE_CAPABILITIES['/assignments/$id']),
  component: AssignmentDetailPage,
});
