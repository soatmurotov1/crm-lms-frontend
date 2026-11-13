import { cleanup, screen } from '@testing-library/react';
import { vi, describe, it, expect, afterEach } from 'vitest';
import { Sidebar } from '@/components/layout/Sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { renderWithRouter } from '@/test/utils/renderWithRouter';
import type { UserRole } from '@/features/staff/types';

// teacher self-service nav trim. Unlike sidebarRail.test.tsx
// (which mocks useCan as one global boolean shared by every capability, fine
// for testing the filter mechanism in isolation), this exercises the REAL
// useCan/permissions.ts matrix via a role-parameterized authStore mock -- so
// it's a genuine regression guard on the CAPABILITIES map, not just this
// component's rendering.

let role: UserRole = 'owner';

vi.mock('@/features/auth/api/authService', () => ({
  useLogout: () => ({ mutate: vi.fn() }),
}));
vi.mock('@/store/authStore', () => ({
  useAuthStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      user: { role, name: 'Test User', branch_name: null },
    }),
}));

afterEach(() => {
  role = 'owner';
  cleanup();
});

const renderSidebar = () =>
  renderWithRouter(
    <TooltipProvider>
      <Sidebar
        mobileOpen={false}
        onMobileOpenChange={vi.fn()}
        desktopExpanded
        onDesktopExpandedChange={vi.fn()}
      />
    </TooltipProvider>,
    { initialEntry: '/dashboard', routePattern: '/dashboard' },
  );

describe('Sidebar teacher nav trim', () => {
  it.each(['dev', 'owner'] as const)(
    'shows the design system for %s',
    async (testRole) => {
      role = testRole;
      await renderSidebar();
      expect(screen.getByLabelText('nav.design_system')).toBeVisible();
    },
  );

  it.each(['manager', 'accountant', 'operator', 'teacher'] as const)(
    'hides the design system for %s',
    async (testRole) => {
      role = testRole;
      await renderSidebar();
      expect(screen.queryByLabelText('nav.design_system')).toBeNull();
    },
  );

  it('hides Payments for a teacher', async () => {
    role = 'teacher';
    await renderSidebar();
    expect(screen.queryByLabelText('nav.payments')).toBeNull();
  });

  it('keeps dashboard/schedule/attendance/groups/students/profile for a teacher', async () => {
    role = 'teacher';
    await renderSidebar();
    expect(screen.getByLabelText('nav.dashboard')).toBeTruthy();
    expect(screen.getByLabelText('nav.schedule')).toBeTruthy();
    expect(screen.getByLabelText('nav.attendance')).toBeTruthy();
    expect(screen.getByLabelText('nav.groups')).toBeTruthy();
    expect(screen.getByLabelText('nav.students')).toBeTruthy();
    expect(screen.getByLabelText('nav.profile')).toBeTruthy();
  });

  it('still hides the already-admin-only items for a teacher', async () => {
    role = 'teacher';
    await renderSidebar();
    expect(screen.queryByLabelText('nav.branches')).toBeNull();
    expect(screen.queryByLabelText('nav.courses')).toBeNull();
    expect(screen.queryByLabelText('nav.operators')).toBeNull();
    expect(screen.queryByLabelText('nav.teachers')).toBeNull();
    expect(screen.queryByLabelText('nav.users')).toBeNull();
    expect(screen.queryByLabelText('nav.audit')).toBeNull();
  });

  // Regression: only teacher's nav should change (Slice A requirement).
  it('still shows Payments for dev', async () => {
    role = 'dev';
    await renderSidebar();
    expect(screen.getByLabelText('nav.payments')).toBeTruthy();
  });

  it('still shows Payments for owner', async () => {
    role = 'owner';
    await renderSidebar();
    expect(screen.getByLabelText('nav.payments')).toBeTruthy();
  });

  it('still shows Payments for manager', async () => {
    role = 'manager';
    await renderSidebar();
    expect(screen.getByLabelText('nav.payments')).toBeTruthy();
  });

  it('still shows Payments for operator', async () => {
    role = 'operator';
    await renderSidebar();
    expect(screen.getByLabelText('nav.payments')).toBeTruthy();
  });

  it('shows an accountant finance dashboard, expenses, and profile in T8B', async () => {
    role = 'accountant';
    await renderSidebar();
    expect(screen.getByLabelText('nav.profile')).toBeTruthy();
    expect(screen.getByLabelText('nav.expenses')).toBeTruthy();
    expect(screen.getByLabelText('nav.dashboard')).toBeTruthy();
    expect(screen.queryByLabelText('nav.students')).toBeNull();
    expect(screen.queryByLabelText('nav.leads')).toBeNull();
  });

  it('hides Leads for teacher', async () => {
    role = 'teacher';
    await renderSidebar();
    expect(screen.queryByLabelText('nav.leads')).toBeNull();
  });

  it('shows Leads for dev, owner, manager, and operator', async () => {
    for (const testRole of ['dev', 'owner', 'manager', 'operator'] as const) {
      role = testRole;
      cleanup();
      await renderSidebar();
      expect(screen.getByLabelText('nav.leads')).toBeTruthy();
    }
  });
});
