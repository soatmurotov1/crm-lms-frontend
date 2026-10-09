/* eslint-disable react-refresh/only-export-components -- TanStack file routes export Route beside their component */
import { useEffect, useMemo, useRef, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import axiosInstance from '@/api/axiosInstance';
import { analyticsCallback, analyticsHandoff } from '@/app/analyticsHandoff';
import { requireAuthenticated } from '@/app/routeGuards';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';

export const Route = createFileRoute('/_authenticated/analytics')({
  beforeLoad: ({ location }) => requireAuthenticated(location),
  validateSearch: (search: Record<string, unknown>) => ({
    state: typeof search.state === 'string' ? search.state : undefined,
    nonce: typeof search.nonce === 'string' ? search.nonce : undefined,
    audience: typeof search.audience === 'string' ? search.audience : undefined,
    returnTo: typeof search.returnTo === 'string' ? search.returnTo : undefined,
  }),
  component: AnalyticsHandoffPage,
});

function AnalyticsHandoffPage() {
  const search = Route.useSearch();
  const sessionValidated = useAuthStore((auth) => auth.sessionValidated);
  const user = useAuthStore((auth) => auth.user);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef<AbortController | null>(null);
  const validated = useMemo(() => {
    try {
      return {
        handoff: analyticsHandoff(
          {
            state: search.state,
            nonce: search.nonce,
            audience: search.audience,
            returnTo: search.returnTo,
          },
          {
            origin: import.meta.env.VITE_ANALYTICS_ORIGIN,
            audience: import.meta.env.VITE_ANALYTICS_AUDIENCE,
            allowLocalHttp: import.meta.env.DEV,
          },
        ),
        error: '',
      };
    } catch (caught) {
      return { handoff: null, error: (caught as Error).message };
    }
  }, [search.state, search.nonce, search.audience, search.returnTo]);

  useEffect(() => () => pending.current?.abort(), []);
  const authorize = async () => {
    const handoff = validated.handoff;
    if (!handoff || !sessionValidated || busy) return;
    const actorId = user?.id;
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    setError('');
    try {
      const response = await axiosInstance.post<unknown>(
        '/platform/analytics/sso/authorize',
        {
          state: handoff.state,
          nonce: handoff.nonce,
          audience: handoff.audience,
        },
        { signal: controller.signal },
      );
      const auth = useAuthStore.getState();
      if (
        controller.signal.aborted ||
        !auth.sessionValidated ||
        !auth.isAuthenticated ||
        auth.user?.id !== actorId
      )
        return;
      window.location.replace(analyticsCallback(handoff, response.data));
    } catch (caught) {
      if (controller.signal.aborted) return;
      const status = (caught as { response?: { status?: number } }).response
        ?.status;
      setError(
        status === 403
          ? 'Bu hisobga platforma egasi Analytics kirishi berilmagan.'
          : status === 400
            ? 'Kirish havolasi yaroqsiz. Analytics orqali qayta boshlang.'
            : 'Kirish tasdiqlanmadi. Analytics orqali qayta boshlang yoki qayta urinib ko‘ring.',
      );
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <title>Analytics kirishi · Auto Maktab</title>
      <PageHeader
        title="Platforma Analytics kirishi"
        description="Joriy CRM hisobingiz bilan platforma egasining nazorat paneliga o‘tish."
      />
      <Card asChild className="max-w-xl space-y-4">
        <section aria-label="Analytics kirishini tasdiqlash">
          <p className="text-sm text-muted-foreground">
            Analytics maktablar nazorati va platforma billingini ko‘rsatadi.
            Kirish huquqi serverda tekshiriladi.
          </p>
          {validated.error ? (
            <p role="alert" className="text-sm text-destructive">
              {validated.error}
            </p>
          ) : (
            <>
              {!sessionValidated && (
                <p role="status" className="text-sm text-muted-foreground">
                  CRM sessiyasi tekshirilmoqda…
                </p>
              )}
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button
                disabled={busy || !sessionValidated}
                onClick={() => {
                  void authorize();
                }}
              >
                {busy ? 'Kirish tasdiqlanmoqda…' : 'Analytics’ga o‘tish'}
              </Button>
            </>
          )}
        </section>
      </Card>
    </div>
  );
}
