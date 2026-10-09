export interface AnalyticsHandoffSettings {
  origin?: string;
  audience?: string;
  allowLocalHttp: boolean;
}

export interface AnalyticsHandoff {
  origin: string;
  state: string;
  nonce: string;
  audience: string;
}

function configuredOrigin(settings: AnalyticsHandoffSettings): string {
  if (!settings.origin || !settings.audience) {
    throw new Error('Analytics kirish sozlamalari berilmagan.');
  }
  let target: URL;
  let audience: URL;
  try {
    target = new URL(settings.origin);
    audience = new URL(settings.audience);
  } catch {
    throw new Error('Analytics kirish sozlamalari noto‘g‘ri.');
  }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(target.hostname);
  const transportAllowed =
    target.protocol === 'https:' ||
    (settings.allowLocalHttp && local && target.protocol === 'http:');
  if (
    !transportAllowed ||
    target.username ||
    target.password ||
    target.pathname !== '/' ||
    target.search ||
    target.hash ||
    !['http:', 'https:'].includes(audience.protocol) ||
    audience.username ||
    audience.password
  ) {
    throw new Error('Analytics kirish sozlamalari noto‘g‘ri.');
  }
  return target.origin;
}

/** All values originate from Analytics' one-time server-created handoff. */
export function analyticsHandoff(
  search: Record<string, unknown>,
  settings: AnalyticsHandoffSettings,
): AnalyticsHandoff {
  const origin = configuredOrigin(settings);
  if (
    typeof search.state !== 'string' ||
    !/^[a-f0-9]{64}$/.test(search.state) ||
    typeof search.nonce !== 'string' ||
    !/^[a-f0-9]{64}$/.test(search.nonce) ||
    search.audience !== settings.audience ||
    search.returnTo !== `${origin}/auth/callback`
  ) {
    throw new Error(
      'Kirish havolasi yaroqsiz. Analytics orqali qayta boshlang.',
    );
  }
  return {
    origin,
    state: search.state,
    nonce: search.nonce,
    audience: settings.audience!,
  };
}

export function analyticsCallback(
  handoff: AnalyticsHandoff,
  response: unknown,
  now = Date.now(),
): string {
  if (
    typeof response !== 'object' ||
    response === null ||
    Array.isArray(response)
  ) {
    throw new Error('Analytics kirish javobi noto‘g‘ri.');
  }
  const result = response as Record<string, unknown>;
  if (
    typeof result.code !== 'string' ||
    !/^[A-Za-z0-9_-]{43}$/.test(result.code) ||
    result.state !== handoff.state ||
    typeof result.expires_at !== 'string' ||
    !Number.isFinite(Date.parse(result.expires_at)) ||
    Date.parse(result.expires_at) <= now
  ) {
    throw new Error(
      'Kirish javobi yaroqsiz yoki muddati tugagan. Analytics orqali qayta boshlang.',
    );
  }
  const callback = new URL('/auth/callback', handoff.origin);
  callback.searchParams.set('code', result.code);
  callback.searchParams.set('state', handoff.state);
  return callback.href;
}
