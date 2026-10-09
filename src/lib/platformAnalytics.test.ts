import { afterEach, expect, it, vi } from 'vitest';
import {
  createHostedAnalytics,
  hostedAnalyticsConfig,
  telemetryAttribution,
} from './platformAnalytics';
afterEach(() => vi.unstubAllGlobals());

it('loads no telemetry module without explicit session consent, or under DNT', async () => {
  const load = vi.fn();
  const analytics = createHostedAnalytics(
    {
      origin: 'https://analytics.example.test',
      environment: 'production',
      source: 'crm-browser',
    },
    ['student_create'],
    load,
  );
  analytics.page('/students/123?phone=private');
  analytics.feature('student_create');
  await analytics.setConsent(false);
  expect(load).not.toHaveBeenCalled();
  vi.stubGlobal('navigator', { doNotTrack: '1' });
  await analytics.setConsent(true);
  expect(load).not.toHaveBeenCalled();
  analytics.dispose();
});

it('sends only redacted pages and allowlisted static feature tags to one configured module', async () => {
  const page = vi.fn();
  const track = vi.fn();
  const dispose = vi.fn();
  const createTracker = vi.fn(() => ({ page, track, dispose }));
  const load = vi.fn(async () => ({ createTracker }));
  const analytics = createHostedAnalytics(
    {
      origin: 'https://analytics.example.test',
      environment: 'production',
      source: 'crm-browser',
    },
    ['student_create'],
    load,
  );
  await analytics.setConsent(true);
  analytics.page('/students/private-phone?email=private@example.test#jwt');
  await analytics.setConsent(true);
  analytics.feature('student_create');
  analytics.feature('private@example.test');
  expect(load).toHaveBeenCalledOnce();
  expect(load).toHaveBeenCalledWith(
    'https://analytics.example.test/tracker/v1.js',
  );
  expect(createTracker).toHaveBeenCalledOnce();
  expect(page).not.toHaveBeenCalled();
  expect(track.mock.calls).toEqual([
    ['page.view', { path: '/students/:id', surface: 'tenant' }],
    ['feature.used', { feature: 'student_create', surface: 'tenant' }],
  ]);
  await analytics.setConsent(false);
  expect(dispose).toHaveBeenCalledOnce();
  analytics.feature('student_create');
  expect(track).toHaveBeenCalledTimes(2);
});

it('filters attribution keys, contact data and numeric or opaque campaign identifiers', () => {
  expect(
    telemetryAttribution(
      '?utm_source=telegram&utm_medium=social&utm_campaign=autumn_2026&email=private%40example.test&session_id=opaque',
      'https://search.example.test/private?token=secret',
    ),
  ).toEqual({
    utm_source: 'telegram',
    utm_medium: 'social',
    utm_campaign: 'autumn_2026',
    referrer: 'search.example.test',
  });
  expect(
    telemetryAttribution(
      '?utm_source=private%40example.test&utm_medium=998901234567&utm_campaign=session_998901234567',
      'https://private:secret@search.example.test/path',
    ),
  ).toEqual({});
  expect(
    telemetryAttribution(
      '?utm_campaign=abc123abc123abc123abc123abc123',
      'javascript:private',
    ),
  ).toEqual({});
  expect(
    telemetryAttribution('?utm_campaign=phone_998-90-123-45-67', ''),
  ).toEqual({});
  expect(
    telemetryAttribution('?utm_campaign=phone_998_90_123_45_67', ''),
  ).toEqual({});
});

it('filters separator-formatted phone labels before emitting page metadata while retaining campaign labels', async () => {
  const track = vi.fn();
  const analytics = createHostedAnalytics(
    {
      origin: 'https://analytics.example.test',
      environment: 'production',
      source: 'crm-browser',
    },
    [],
    async () => ({
      createTracker: () => ({ page: vi.fn(), track, dispose: vi.fn() }),
    }),
  );
  await analytics.setConsent(true);
  analytics.page('/dashboard', {
    utm_source: 'phone_998 90 123 45 67',
    utm_medium: 'phone_998.90.123.45.67',
    utm_campaign: 'phone_998-90-123-45-67',
  });
  analytics.page('/profile', { utm_campaign: 'autumn_2026' });
  expect(track.mock.calls).toEqual([
    ['page.view', { path: '/dashboard', surface: 'tenant' }],
    [
      'page.view',
      { path: '/profile', surface: 'tenant', utm_campaign: 'autumn_2026' },
    ],
  ]);
  analytics.dispose();
});

it('counts distinct entity navigation before redaction with observed per-page attribution only', async () => {
  const track = vi.fn();
  const analytics = createHostedAnalytics(
    {
      origin: 'https://analytics.example.test',
      environment: 'production',
      source: 'crm-browser',
    },
    [],
    async () => ({
      createTracker: () => ({ page: vi.fn(), track, dispose: vi.fn() }),
    }),
  );
  await analytics.setConsent(true);
  analytics.page(
    '/students/student-a',
    telemetryAttribution(
      '?utm_source=telegram&utm_medium=social&utm_campaign=autumn_2026',
      'https://search.example.test/private?email=private',
    ),
  );
  analytics.page('/students/student-a?email=private');
  analytics.page(
    '/students/student-b',
    telemetryAttribution(
      '',
      'https://search.example.test/private?email=private',
    ),
  );
  expect(track.mock.calls).toEqual([
    [
      'page.view',
      {
        path: '/students/:id',
        surface: 'tenant',
        utm_source: 'telegram',
        utm_medium: 'social',
        utm_campaign: 'autumn_2026',
        referrer: 'search.example.test',
      },
    ],
    [
      'page.view',
      {
        path: '/students/:id',
        surface: 'tenant',
        referrer: 'search.example.test',
      },
    ],
  ]);
  analytics.dispose();
});

it('discards pre-consent context and a revoked pending module page, including under GPC', async () => {
  const track = vi.fn();
  const createTracker = vi.fn(() => ({
    page: vi.fn(),
    track,
    dispose: vi.fn(),
  }));
  let resolveLoad!: (module: { createTracker: typeof createTracker }) => void;
  const load = vi.fn(
    () =>
      new Promise<{ createTracker: typeof createTracker }>((resolve) => {
        resolveLoad = resolve;
      }),
  );
  const analytics = createHostedAnalytics(
    {
      origin: 'https://analytics.example.test',
      environment: 'production',
      source: 'crm-browser',
    },
    [],
    load,
  );
  analytics.page('/students/pre-consent', { utm_source: 'preconsent' });
  const pending = analytics.setConsent(true);
  analytics.page('/students/revoked', { utm_source: 'revoked' });
  await analytics.setConsent(false);
  resolveLoad({ createTracker });
  await pending;
  expect(createTracker).not.toHaveBeenCalled();
  await analytics.setConsent(true);
  analytics.page('/students/current', { utm_source: 'current' });
  expect(track.mock.calls).toEqual([
    [
      'page.view',
      { path: '/students/:id', surface: 'tenant', utm_source: 'current' },
    ],
  ]);
  vi.stubGlobal('navigator', { globalPrivacyControl: true });
  analytics.page('/students/blocked', { utm_source: 'blocked' });
  analytics.feature('unlisted');
  expect(track).toHaveBeenCalledOnce();
  analytics.dispose();
});

it('preserves two consented navigations during module loading without duplicate or raw pages', async () => {
  const track = vi.fn();
  const createTracker = vi.fn(() => ({
    page: vi.fn(),
    track,
    dispose: vi.fn(),
  }));
  let resolveLoad!: (module: { createTracker: typeof createTracker }) => void;
  const analytics = createHostedAnalytics(
    {
      origin: 'https://analytics.example.test',
      environment: 'production',
      source: 'crm-browser',
    },
    [],
    () =>
      new Promise((resolve) => {
        resolveLoad = resolve;
      }),
  );
  const pending = analytics.setConsent(true);
  analytics.page('/students/student-a?email=private');
  analytics.page('/students/student-a?email=changed');
  analytics.page('/students/student-b');
  resolveLoad({ createTracker });
  await pending;
  expect(track.mock.calls).toEqual(
    Array.from({ length: 2 }, () => [
      'page.view',
      { path: '/students/:id', surface: 'tenant' },
    ]),
  );
  analytics.dispose();
});

it('clears pending context when DNT changes before the module resolves', async () => {
  const privacy = { doNotTrack: '0' };
  vi.stubGlobal('navigator', privacy);
  const track = vi.fn();
  const createTracker = vi.fn(() => ({
    page: vi.fn(),
    track,
    dispose: vi.fn(),
  }));
  let resolveLoad!: (module: { createTracker: typeof createTracker }) => void;
  const analytics = createHostedAnalytics(
    {
      origin: 'https://analytics.example.test',
      environment: 'production',
      source: 'crm-browser',
    },
    [],
    () =>
      new Promise((resolve) => {
        resolveLoad = resolve;
      }),
  );
  const pending = analytics.setConsent(true);
  analytics.page('/students/current', { utm_source: 'blocked' });
  privacy.doNotTrack = '1';
  resolveLoad({ createTracker });
  await pending;
  expect(createTracker).not.toHaveBeenCalled();
  privacy.doNotTrack = '0';
  await analytics.setConsent(true);
  analytics.page('/students/current', { utm_source: 'fresh' });
  expect(track.mock.calls).toEqual([
    [
      'page.view',
      { path: '/students/:id', surface: 'tenant', utm_source: 'fresh' },
    ],
  ]);
  analytics.dispose();
});

it('isolates module load failure and rejects insecure or unconfigured targets', async () => {
  const analytics = createHostedAnalytics(
    {
      origin: 'https://analytics.example.test',
      environment: 'production',
      source: 'crm-browser',
    },
    [],
    async () => {
      throw new Error('module unavailable');
    },
  );
  await expect(analytics.setConsent(true)).resolves.toBeUndefined();
  expect(() => analytics.page('/dashboard')).not.toThrow();
  expect(
    hostedAnalyticsConfig({
      origin: 'http://other.example.test',
      environment: 'production',
      source: 'crm-browser',
    }),
  ).toBeNull();
  expect(
    hostedAnalyticsConfig({
      origin: 'https://localhost',
      environment: 'production',
      source: 'crm-browser',
    }),
  ).toBeNull();
  expect(
    hostedAnalyticsConfig({
      origin: 'https://analytics.example.test',
      source: 'crm-browser',
    }),
  ).toBeNull();
  analytics.dispose();
});
