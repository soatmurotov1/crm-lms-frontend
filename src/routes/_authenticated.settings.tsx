import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';
import { requireCompanyOwner } from '@/app/routeGuards';

export const Route = createFileRoute('/_authenticated/settings')({
  beforeLoad: ({ location }) => requireCompanyOwner(location),
  component: lazyRouteComponent(
    () => import('@/features/settings/pages/SettingsPage'),
  ),
});
