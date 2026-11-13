import { createFileRoute } from '@tanstack/react-router';
import { requireCapability } from '@/app/routeGuards';
import { ROUTE_CAPABILITIES } from '@/app/routeAccess';
import AssignmentsPage from '@/features/lms/pages/AssignmentsPage';

export const Route = createFileRoute('/_authenticated/assignments/')({
  beforeLoad: ({ location }) =>
    requireCapability(location, ROUTE_CAPABILITIES['/assignments']),
  component: AssignmentsPage,
});
