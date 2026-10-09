import { describe, expect, it } from 'vitest';
import { analyticsHandoff, analyticsCallback } from './analyticsHandoff';

const settings = {
  origin: 'https://analytics.example.test',
  audience: 'https://analytics.example.test',
  allowLocalHttp: false,
};
const search = {
  state: 'a'.repeat(64),
  nonce: 'b'.repeat(64),
  audience: settings.audience,
  returnTo: `${settings.origin}/auth/callback`,
};

describe('analytics founder handoff', () => {
  it('rejects an unconfigured or substituted callback before issuing authorization', () => {
    expect(() =>
      analyticsHandoff(search, { ...settings, origin: '' }),
    ).toThrow();
    for (const returnTo of [
      'https://other.example.test/auth/callback',
      `${settings.origin}/auth/callback?token=secret`,
      `${settings.origin}/auth/callback#fragment`,
    ]) {
      expect(() =>
        analyticsHandoff({ ...search, returnTo }, settings),
      ).toThrow();
    }
    expect(() =>
      analyticsHandoff(
        { ...search, audience: 'https://other.example.test' },
        settings,
      ),
    ).toThrow();
  });

  it('returns only a fresh one-time code and matching state to the configured callback', () => {
    const handoff = analyticsHandoff(search, settings);
    const response = {
      code: 'c'.repeat(43),
      state: search.state,
      expires_at: '2026-10-08T12:00:30Z',
      token: 'never-redirect-this',
    };
    const callback = new URL(
      analyticsCallback(handoff, response, Date.parse('2026-10-08T12:00:00Z')),
    );
    expect(callback.origin + callback.pathname).toBe(search.returnTo);
    expect([...callback.searchParams.keys()]).toEqual(['code', 'state']);
    expect(callback.searchParams.get('code')).toBe(response.code);
    expect(callback.href).not.toContain('never-redirect-this');
    expect(() =>
      analyticsCallback(
        handoff,
        { ...response, state: 'd'.repeat(64) },
        Date.parse('2026-10-08T12:00:00Z'),
      ),
    ).toThrow();
    expect(() =>
      analyticsCallback(handoff, response, Date.parse('2026-10-08T12:01:00Z')),
    ).toThrow();
  });
});
