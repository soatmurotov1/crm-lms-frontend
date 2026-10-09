import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useLocation } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  createHostedAnalytics,
  crmTelemetrySettings,
  hostedAnalyticsConfig,
  saveTelemetryConsent,
  subscribeTelemetry,
  telemetryAttribution,
  telemetrySnapshot,
  type TelemetryConsent,
} from '@/lib/platformAnalytics';

const features = [
  'login_success',
  'demo_enter',
  'student_create',
  'student_update',
  'student_delete',
  'student_restore',
  'student_create_with_payment',
  'group_create',
  'group_restore',
  'course_create',
  'course_update',
  'course_delete',
  'lesson_create',
  'lesson_update',
  'attendance_mark',
  'payment_create',
  'payment_update',
  'payment_delete',
  'expense_create',
  'expense_update',
  'expense_cancel',
  'expense_delete',
  'expense_payment_create',
  'expense_payment_void',
  'teacher_settlement_create',
];
const configured = Boolean(hostedAnalyticsConfig(crmTelemetrySettings));

export function PlatformAnalyticsConsent() {
  return configured ? <ConsentControl /> : null;
}
function ConsentControl() {
  const location = useLocation();
  const bridge = useRef<ReturnType<typeof createHostedAnalytics> | null>(null);
  const snapshot = useSyncExternalStore(
    subscribeTelemetry,
    telemetrySnapshot,
    () => 'pending|allowed',
  );
  const choice = snapshot.split('|')[0] as TelemetryConsent;
  const privacy = snapshot.endsWith('|allowed');
  useEffect(() => {
    if (!configured) return;
    const client = createHostedAnalytics(crmTelemetrySettings, features);
    bridge.current = client;
    const feature = (event: Event) => {
      const name: unknown = (event as CustomEvent<unknown>).detail;
      if (typeof name === 'string') client.feature(name);
    };
    window.addEventListener('automaktab_crm_feature', feature);
    return () => {
      window.removeEventListener('automaktab_crm_feature', feature);
      client.dispose();
      bridge.current = null;
    };
  }, []);
  useEffect(() => {
    const client = bridge.current;
    if (!client) return;
    const granted = choice === 'granted' && privacy;
    void client.setConsent(granted);
    if (granted)
      client.page(
        window.location.pathname,
        telemetryAttribution(window.location.search, document.referrer),
      );
  }, [location.pathname, location.searchStr, choice, privacy]);
  const choose = (value: Exclude<TelemetryConsent, 'pending'>) =>
    saveTelemetryConsent(value);
  if (!privacy) return null;
  return (
    <Card asChild className="mx-auto my-4 max-w-2xl space-y-3 text-sm">
      <aside aria-label="Statistika roziligi">
        <details open={choice === 'pending'}>
          <summary className="cursor-pointer font-medium">
            Foydalanish statistikasi ·{' '}
            {choice === 'granted'
              ? 'Rozilik berilgan'
              : choice === 'declined'
                ? 'O‘chirilgan'
                : 'Ixtiyoriy'}
          </summary>
          <p className="mt-2 text-muted-foreground">
            Sahifalar va funksiyalardan foydalanish haqida shaxsiy ma’lumotsiz
            statistikaga rozimisiz? Tanlov ushbu brauzer sessiyasi uchun
            saqlanadi.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              onClick={() => choose('granted')}
              disabled={choice === 'granted'}
            >
              Roziman
            </Button>
            <Button variant="outline" onClick={() => choose('declined')}>
              {choice === 'granted'
                ? 'Statistikani o‘chirish'
                : 'Rozilik bermayman'}
            </Button>
          </div>
        </details>
      </aside>
    </Card>
  );
}
