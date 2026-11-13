import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Outlet, useLocation } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Breadcrumbs } from './Breadcrumbs';
import { useCommandPalette } from './useCommandPalette';
import { PageLoader } from './PageLoader';
import { cn } from '@/lib/utils';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuthStore } from '@/store/authStore';
import {
  CRM_TOUR_DESKTOP_QUERY,
  shouldStartTour,
  type OwnerCrmTourStepId,
} from '@/lib/ownerCrmTour';

const OwnerCrmTour = lazy(() => import('@/components/tour/OwnerCrmTour'));

const CommandPalette = lazy(() => import('./CommandPalette'));

const DESKTOP_SIDEBAR_STORAGE_KEY = 'lms-sidebar-expanded';

const readDesktopSidebarExpanded = () => {
  if (typeof window === 'undefined') return true;

  try {
    return window.localStorage.getItem(DESKTOP_SIDEBAR_STORAGE_KEY) !== 'false';
  } catch {
    return true;
  }
};

export const AppLayout = () => {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const activeBranchId = useAuthStore((state) => state.activeBranchId);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const sessionValidated = useAuthStore((state) => state.sessionValidated);
  const [tourDismissed, setTourDismissed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarExpanded, setDesktopSidebarExpanded] = useState(
    readDesktopSidebarExpanded,
  );
  const location = useLocation();
  const { pathname, href } = location;
  const sidebarExpanded = desktopSidebarExpanded;
  const prevPathnameRef = useRef(pathname);
  const mainRef = useRef<HTMLElement>(null);
  const palette = useCommandPalette();
  const desktopExpandedRef = useRef(desktopSidebarExpanded);
  const sidebarBeforeTourRef = useRef<boolean | null>(null);

  useEffect(() => {
    desktopExpandedRef.current = desktopSidebarExpanded;
  }, [desktopSidebarExpanded]);

  const prepareTourChrome = useCallback((stepId: OwnerCrmTourStepId) => {
    const desktop = window.matchMedia(CRM_TOUR_DESKTOP_QUERY).matches;
    if (stepId === 'sidebar') {
      if (desktop) {
        if (sidebarBeforeTourRef.current === null) {
          sidebarBeforeTourRef.current = desktopExpandedRef.current;
        }
        setDesktopSidebarExpanded(true);
      } else {
        setMobileSidebarOpen(true);
      }
      return;
    }
    setMobileSidebarOpen(false);
  }, []);

  const releaseTourChrome = useCallback(() => {
    if (sidebarBeforeTourRef.current === false) {
      setDesktopSidebarExpanded(false);
    }
    sidebarBeforeTourRef.current = null;
    setMobileSidebarOpen(false);
  }, []);

  const showOwnerTour =
    hasHydrated &&
    isAuthenticated &&
    sessionValidated &&
    !tourDismissed &&
    shouldStartTour({
      role: user?.role,
      email: user?.email,
      companySlug: user?.company_slug,
      crmTourCompletedAt: user?.crm_tour_completed_at,
      blockingModal: Boolean(user?.must_change_password),
    });

  // Match the previous router: any committed navigation (including a same-page
  // query update) closes the mobile drawer without waiting for an effect.
  const [committedHref, setCommittedHref] = useState(href);
  if (href !== committedHref) {
    setCommittedHref(href);
    setMobileSidebarOpen(false);
  }

  useEffect(() => {
    const pathChanged = pathname !== prevPathnameRef.current;
    prevPathnameRef.current = pathname;
    if (pathChanged) {
      mainRef.current?.focus({ preventScroll: true });
    }
  }, [pathname]);

  const handleDesktopSidebarExpandedChange = (expanded: boolean) => {
    setDesktopSidebarExpanded(expanded);
    try {
      window.localStorage.setItem(
        DESKTOP_SIDEBAR_STORAGE_KEY,
        String(expanded),
      );
    } catch {
      // Storage can be unavailable in private/restricted browser contexts.
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-dvh bg-background">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
        >
          {t('a11y.skip_to_content')}
        </a>
        <Sidebar
          mobileOpen={mobileSidebarOpen}
          onMobileOpenChange={setMobileSidebarOpen}
          desktopExpanded={sidebarExpanded}
          onDesktopExpandedChange={handleDesktopSidebarExpandedChange}
        />
        <div
          className={cn(
            'relative flex min-h-dvh flex-col',
            sidebarExpanded ? 'lg:ml-64' : 'lg:ml-14',
          )}
        >
          <div className="sticky top-0 z-30">
            <Topbar
              onMobileMenuClick={() => setMobileSidebarOpen(true)}
              onCommandPaletteOpen={() => palette.setOpen(true)}
            />
          </div>
          <main
            ref={mainRef}
            id="main-content"
            tabIndex={-1}
            className="flex-1 p-2 outline-none lg:p-3"
          >
            <div className="w-full">
              <Breadcrumbs />
              <Suspense fallback={<PageLoader />}>
                <Outlet
                  key={`${user?.id}:${user?.company_id}:${user?.access_version}:${activeBranchId}`}
                />
              </Suspense>
            </div>
          </main>
        </div>
        {palette.open ? (
          <Suspense fallback={null}>
            <CommandPalette
              open={palette.open}
              onOpenChange={palette.setOpen}
            />
          </Suspense>
        ) : null}
        {showOwnerTour ? (
          <Suspense fallback={null}>
            <OwnerCrmTour
              onFinished={() => setTourDismissed(true)}
              prepareChrome={prepareTourChrome}
              releaseChrome={releaseTourChrome}
            />
          </Suspense>
        ) : null}
      </div>
    </TooltipProvider>
  );
};
