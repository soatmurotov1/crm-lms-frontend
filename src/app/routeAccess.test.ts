import { describe, expect, it, vi } from 'vitest';
import { roleCan } from '@/lib/permissions';
import { ROUTE_CAPABILITIES } from './routeAccess';
import { requireCapability } from './routeGuards';
import { NAV_ITEMS } from '@/lib/navigation';
import type { UserRole } from '@/features/staff/types';

const ROLES: UserRole[] = [
  'dev',
  'owner',
  'manager',
  'accountant',
  'operator',
  'teacher',
];

const allowedRoles = (path: keyof typeof ROUTE_CAPABILITIES) =>
  ROLES.filter((role) => roleCan(role, ROUTE_CAPABILITIES[path]));

describe('protected route capability matrix', () => {
  it.each([
    [
      '/dashboard',
      ['dev', 'owner', 'manager', 'accountant', 'operator', 'teacher'],
    ],
    ['/expenses', ['owner', 'manager', 'accountant']],
    ['/expenses/$id', ['owner', 'manager', 'accountant']],
    ['/schedule', ['dev', 'owner', 'manager', 'operator', 'teacher']],
    ['/attendance', ['dev', 'owner', 'manager', 'operator', 'teacher']],
    ['/groups', ['dev', 'owner', 'manager', 'operator', 'teacher']],
    ['/groups/$id', ['dev', 'owner', 'manager', 'operator', 'teacher']],
    ['/students', ['dev', 'owner', 'manager', 'operator', 'teacher']],
    ['/students/$id', ['dev', 'owner', 'manager', 'operator', 'teacher']],
    ['/leads', ['dev', 'owner', 'manager', 'operator']],
    ['/leads/$id', ['dev', 'owner', 'manager', 'operator']],
    ['/branches', ['dev', 'owner']],
    ['/branches/$id', ['dev', 'owner']],
    ['/courses', ['dev', 'owner', 'manager']],
    ['/courses/$id', ['dev', 'owner', 'manager']],
    ['/payments', ['dev', 'owner', 'manager', 'accountant', 'operator']],
    ['/teachers', ['dev', 'owner', 'manager']],
    ['/users', ['dev', 'owner']],
    ['/design-system', ['dev', 'owner']],
    ['/users/$id', ['dev', 'owner', 'manager']],
    ['/documents', ['dev', 'owner', 'manager', 'operator', 'teacher']],
    ['/audit', ['dev', 'owner']],
    ['/audit/$id', ['dev', 'owner']],
  ] as const)('%s keeps its approved role boundary', (path, expected) => {
    expect(allowedRoles(path)).toEqual(expected);
  });
});

const guardAuth = vi.hoisted(() => ({
  role: 'owner' as UserRole,
}));
vi.mock('@/store/authStore', () => ({
  useAuthStore: {
    getState: () => ({
      hasHydrated: true,
      isAuthenticated: true,
      activeBranchId: null,
      user: {
        id: 'design-system-user',
        email: 'sample@example.com',
        role: guardAuth.role,
      },
    }),
  },
}));

describe('design-system route enforcement', () => {
  it('registers a System item with the same capability as the guarded route', () => {
    expect(ROUTE_CAPABILITIES['/design-system']).toBe('manageUsers');
    expect(NAV_ITEMS).toContainEqual(
      expect.objectContaining({
        path: '/design-system',
        section: 'system',
        cap: 'manageUsers',
      }),
    );
  });
  it.each(ROLES)('enforces direct route access for %s', (role) => {
    guardAuth.role = role;
    const enter = () =>
      requireCapability(
        { pathname: '/design-system', searchStr: '' },
        ROUTE_CAPABILITIES['/design-system'],
      );
    if (role === 'owner' || role === 'dev') expect(enter).not.toThrow();
    else expect(enter).toThrow();
  });
});
