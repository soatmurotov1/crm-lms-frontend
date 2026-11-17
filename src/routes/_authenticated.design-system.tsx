import { useTranslation } from 'react-i18next';
import { createFileRoute } from '@tanstack/react-router';
import { requireCapability } from '@/app/routeGuards';
import { ROUTE_CAPABILITIES } from '@/app/routeAccess';
import { DesignSystemBoard } from '@/features/design-system/DesignSystemBoard';

export const Route = createFileRoute('/_authenticated/design-system')({
  beforeLoad: ({ location }) =>
    requireCapability(location, ROUTE_CAPABILITIES['/design-system']),
  component: function DesignSystemPage() {
    const { t } = useTranslation();
    return (
      <>
        {/* React 19: <title> faqat bitta matn qabul qiladi, aks holda bo'sh qoladi. */}
        <title>{`${t('design_system.title')} · EduLMS`}</title>
        <meta name="description" content={t('design_system.description')} />
        <DesignSystemBoard />
      </>
    );
  },
});
