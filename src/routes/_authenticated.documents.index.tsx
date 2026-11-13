import { createFileRoute } from '@tanstack/react-router';
import { requireCapability } from '@/app/routeGuards';
import { ROUTE_CAPABILITIES } from '@/app/routeAccess';
import DocumentsPage from '@/features/documents/pages/DocumentsPage';

export const Route = createFileRoute('/_authenticated/documents/')({
  beforeLoad: ({ location }) =>
    requireCapability(location, ROUTE_CAPABILITIES['/documents']),
  component: DocumentsPage,
});
