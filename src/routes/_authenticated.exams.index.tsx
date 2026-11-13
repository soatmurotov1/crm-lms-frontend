import { createFileRoute } from '@tanstack/react-router';
import { requireCapability } from '@/app/routeGuards';
import { ROUTE_CAPABILITIES } from '@/app/routeAccess';
import ExamsPage from '@/features/lms/pages/ExamsPage';

export const Route = createFileRoute('/_authenticated/exams/')({
  beforeLoad: ({ location }) =>
    requireCapability(location, ROUTE_CAPABILITIES['/exams']),
  component: ExamsPage,
});
