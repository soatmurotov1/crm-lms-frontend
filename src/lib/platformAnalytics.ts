type Environment = 'synthetic' | 'development' | 'production';
export type TelemetryConsent = 'pending' | 'granted' | 'declined';
export interface TelemetryAttribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referrer?: string;
}
export interface HostedAnalyticsSettings {
  origin?: string;
  environment?: string;
  source: 'crm-browser' | 'marketing';
}
interface Tracker {
  page(path: string): void;
  track(name: string, properties: Record<string, string>): void;
  dispose(): void;
}
export interface TrackerModule {
  createTracker(options: {
    source: string;
    surface: string;
    endpoint: string;
    environment: Environment;
    consent: boolean;
  }): Tracker;
}
export type ModuleLoader = (url: string) => Promise<TrackerModule>;
export const crmTelemetrySettings: HostedAnalyticsSettings = {
  origin: import.meta.env.VITE_ANALYTICS_COLLECTOR_ORIGIN,
  environment: import.meta.env.VITE_ANALYTICS_ENVIRONMENT,
  source: 'crm-browser',
};
const consentKey = 'automaktab.telemetry-consent.v1';
const consentEvent = 'automaktab-telemetry-consent';
let memoryConsent: TelemetryConsent = 'pending';
const segments = new Set([
  'uz',
  'ru',
  'en',
  'pricing',
  'about',
  'contact',
  'login',
  'register',
  'dashboard',
  'students',
  'branches',
  'groups',
  'attendance',
  'payments',
  'expenses',
  'users',
  'operators',
  'teachers',
  'vehicles',
  'schedule',
  'profile',
  'leads',
  'questions',
  'courses',
  'learning',
  'tests',
  'results',
  'practice',
  'blog',
  'features',
  'training-programs',
  'training-enrollments',
  'driving-sessions',
  'my-settlements',
  'audit',
  'fleet-map',
]);

export function hostedAnalyticsConfig(
  settings: HostedAnalyticsSettings,
): { origin: string; environment: Environment } | null {
  if (
    !settings.origin ||
    !['synthetic', 'development', 'production'].includes(
      settings.environment ?? '',
    )
  )
    return null;
  try {
    const url = new URL(settings.origin);
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (local && settings.environment !== 'synthetic') return null;
    const transport =
      url.protocol === 'https:' ||
      (settings.environment === 'synthetic' &&
        url.protocol === 'http:' &&
        ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname));
    if (
      !transport ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    )
      return null;
    return {
      origin: url.origin,
      environment: settings.environment as Environment,
    };
  } catch {
    return null;
  }
}
export function telemetryPrivacyAllowed(): boolean {
  return (
    typeof navigator === 'undefined' ||
    (navigator.doNotTrack !== '1' &&
      !(navigator as Navigator & { globalPrivacyControl?: boolean })
        .globalPrivacyControl)
  );
}
export function readTelemetryConsent(): TelemetryConsent {
  try {
    const value = sessionStorage.getItem(consentKey);
    return value === 'granted' || value === 'declined' ? value : memoryConsent;
  } catch {
    return memoryConsent;
  }
}
export function saveTelemetryConsent(
  choice: Exclude<TelemetryConsent, 'pending'>,
): void {
  memoryConsent = choice;
  try {
    sessionStorage.setItem(consentKey, choice);
  } catch {
    /* Restricted storage leaves consent in this page's memory only. */
  }
  if (typeof window !== 'undefined')
    window.dispatchEvent(new Event(consentEvent));
}
export function telemetrySnapshot(): string {
  return `${readTelemetryConsent()}|${telemetryPrivacyAllowed() ? 'allowed' : 'blocked'}`;
}
export function subscribeTelemetry(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  window.addEventListener(consentEvent, listener);
  window.addEventListener('focus', listener);
  const storage = (event: StorageEvent) => {
    if (event.key === consentKey) {
      memoryConsent = 'pending';
      listener();
    }
  };
  window.addEventListener('storage', storage);
  return () => {
    window.removeEventListener(consentEvent, listener);
    window.removeEventListener('focus', listener);
    window.removeEventListener('storage', storage);
  };
}
function publicPath(path: string): string {
  return (
    '/' +
    (path.split(/[?#]/)[0] ?? '')
      .split('/')
      .filter(Boolean)
      .slice(0, 8)
      .map((segment) => (segments.has(segment) ? segment : ':id'))
      .join('/')
  );
}
function campaignLabel(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[a-z][a-z0-9_. -]{0,63}$/i.test(value) &&
    !/\d{5,}|[a-z0-9]{24,}|^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    ) &&
    !/\d{7,}/.test(value.replace(/[_. -]/g, ''))
  );
}
function referrerHost(value: string): string | undefined {
  const hostPattern =
    /^(?=.{1,128}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
  if (hostPattern.test(value)) return value.toLowerCase();
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) &&
      !url.username &&
      !url.password &&
      hostPattern.test(url.hostname)
      ? url.hostname
      : undefined;
  } catch {
    return undefined;
  }
}
function cleanAttribution(value: TelemetryAttribution): Record<string, string> {
  const clean: Record<string, string> = {};
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign'] as const) {
    const label = value[key];
    if (campaignLabel(label)) clean[key] = label;
  }
  const host = referrerHost(value.referrer ?? '');
  if (host) clean.referrer = host;
  return clean;
}
/** Observed page metadata only: no attribution model/window or raw query retention. */
export function telemetryAttribution(
  search: string,
  referrer: string,
): TelemetryAttribution {
  const query = new URLSearchParams(search);
  return cleanAttribution({
    utm_source: query.get('utm_source') ?? undefined,
    utm_medium: query.get('utm_medium') ?? undefined,
    utm_campaign: query.get('utm_campaign') ?? undefined,
    referrer,
  });
}

/** The external module is fetched only after a separate affirmative consent. */
export function createHostedAnalytics(
  settings: HostedAnalyticsSettings,
  features: readonly string[],
  load: ModuleLoader = (url) =>
    import(/* @vite-ignore */ url) as Promise<TrackerModule>,
) {
  const config = hostedAnalyticsConfig(settings);
  const allowedFeatures = new Set(features);
  let consent = false;
  let alive = true;
  let generation = 0;
  let tracker: Tracker | undefined;
  let loading: Promise<TrackerModule> | undefined;
  let navigationPath = '';
  let pendingPages: Record<string, string>[] = [];
  const stop = () => {
    try {
      tracker?.dispose();
    } catch {
      /* Cleanup must not interrupt navigation. */
    }
    tracker = undefined;
    navigationPath = '';
    pendingPages = [];
  };
  return {
    configured: Boolean(config),
    async setConsent(granted: boolean): Promise<void> {
      consent = granted && telemetryPrivacyAllowed();
      const current = ++generation;
      if (!consent) {
        stop();
        return;
      }
      if (!config || !alive || tracker) return;
      try {
        loading ??= load(`${config.origin}/tracker/v1.js`);
        const sdk = await loading;
        if (!alive || !consent || current !== generation) return;
        if (!telemetryPrivacyAllowed()) {
          consent = false;
          generation++;
          stop();
          return;
        }
        tracker = sdk.createTracker({
          source: settings.source,
          surface: settings.source === 'marketing' ? 'marketing' : 'tenant',
          endpoint: `${config.origin}/collect/v1/events`,
          environment: config.environment,
          consent: true,
        });
        const pages = pendingPages;
        pendingPages = [];
        for (const page of pages) tracker.track('page.view', page);
      } catch {
        loading = undefined; /* Telemetry cannot interrupt the host. */
      }
    },
    page(value: string, attribution: TelemetryAttribution = {}): void {
      if (!consent || !alive || !config) return;
      if (!telemetryPrivacyAllowed()) {
        consent = false;
        generation++;
        stop();
        return;
      }
      // Only the pathname is retained locally for deduplication; the SDK receives its template.
      const next = value.split(/[?#]/)[0] ?? '/';
      if (next === navigationPath) return;
      navigationPath = next;
      const page = {
        path: publicPath(next),
        surface: settings.source === 'marketing' ? 'marketing' : 'tenant',
        ...cleanAttribution(attribution),
      };
      try {
        if (tracker) tracker.track('page.view', page);
        else {
          if (pendingPages.length >= 100) pendingPages.shift();
          pendingPages.push(page);
        }
      } catch {
        /* Best effort. */
      }
    },
    feature(name: string): void {
      if (!consent || !alive) return;
      if (!telemetryPrivacyAllowed()) {
        consent = false;
        generation++;
        stop();
        return;
      }
      if (!allowedFeatures.has(name)) return;
      try {
        tracker?.track('feature.used', {
          feature: name,
          surface: settings.source === 'marketing' ? 'marketing' : 'tenant',
        });
      } catch {
        /* No raw action payload crosses this boundary. */
      }
    },
    dispose(): void {
      alive = false;
      consent = false;
      generation++;
      stop();
    },
  };
}
