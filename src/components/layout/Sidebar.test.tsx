import { cleanup } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { Sidebar } from './Sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { renderWithRouter } from '@/test/utils/renderWithRouter';

vi.mock('./SidebarAccountCard', () => ({ SidebarAccountCard: () => null }));
vi.mock('@/hooks/useCan', () => ({ useCan: () => true }));
vi.mock('@/store/authStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ user: { role: 'owner', name: 'Test Owner' } }),
}));

afterEach(cleanup);

it('keeps collapsed navigation icons labelled without visible label text', async () => {
  const { container } = await renderWithRouter(
    <TooltipProvider>
      <Sidebar
        mobileOpen={false}
        onMobileOpenChange={vi.fn()}
        desktopExpanded={false}
        onDesktopExpandedChange={vi.fn()}
      />
    </TooltipProvider>,
    { initialEntry: '/dashboard', routePattern: '/dashboard' },
  );

  const navigation = container.querySelector('#desktop-sidebar-navigation')!;
  const links = navigation.querySelectorAll('[data-sidebar-item]');
  const sections = navigation.querySelectorAll('[data-sidebar-section]');
  expect(links.length).toBeGreaterThan(0);
  expect(sections.length).toBeGreaterThan(0);
  for (const control of [...links, ...sections]) {
    expect(control.getAttribute('aria-label')).toBeTruthy();
    expect(control.textContent).toBe('');
  }
  expect(navigation.textContent).toBe('');
});
