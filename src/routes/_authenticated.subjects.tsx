import { createFileRoute } from '@tanstack/react-router';
import { requireCapability } from '@/app/routeGuards';
import { ROUTE_CAPABILITIES } from '@/app/routeAccess';
import SubjectsPage from '@/features/lms/pages/SubjectsPage';

export const Route = createFileRoute('/_authenticated/subjects')({
  beforeLoad: ({ location }) =>
    requireCapability(location, ROUTE_CAPABILITIES['/subjects']),
  component: SubjectsPage,
});
