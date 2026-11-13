import { createFileRoute } from '@tanstack/react-router';
import { requireCapability } from '@/app/routeGuards';
import { ROUTE_CAPABILITIES } from '@/app/routeAccess';
import GradesPage from '@/features/lms/pages/GradesPage';

export const Route = createFileRoute('/_authenticated/grades')({
  beforeLoad: ({ location }) =>
    requireCapability(location, ROUTE_CAPABILITIES['/grades']),
  component: GradesPage,
});
