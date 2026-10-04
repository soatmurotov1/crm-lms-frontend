import {
  act,
  cleanup,
  fireEvent,
  screen,
  waitFor,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TrainingEnrollmentsPage from '@/features/training/pages/TrainingEnrollmentsPage';
import { renderWithRouter } from '@/test/utils/renderWithRouter';
import { useAuthStore } from '@/store/authStore';

const { enrollments, refetch, ui } = vi.hoisted(() => ({
  enrollments: vi.fn(),
  refetch: vi.fn(),
  ui: { legacyLabel: 'Historical record', canViewAll: false },
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => (key === 'training.legacy' ? ui.legacyLabel : key),
  }),
}));
vi.mock('@/hooks/useCan', () => ({
  useCan: (permission: string) =>
    permission === 'viewAllBranches' && ui.canViewAll,
}));
vi.mock('@/features/branches/api/branchService', () => ({
  useBranches: () => ({
    data: [
      { id: 'b1', name: 'Branch one' },
      { id: 'b2', name: 'Branch two' },
    ],
  }),
}));
vi.mock('@/hooks/useWriteOptions', () => ({
  useWriteOptions: () => ({ scoped: false }),
}));
vi.mock('@/features/training/api/trainingService', () => ({
  useTrainingEnrollmentsPage: enrollments,
  useActiveTrainingPrograms: () => ({ data: [] }),
  useCreateTrainingEnrollment: () => ({ isPending: false }),
}));

const enrollment = {
  id: 'late-match',
  branch_id: 'b1',
  student: { id: 's1', first_name: 'Authoritative', last_name: 'Result' },
  category: 'B',
  program_id: 'p1',
  program_name: 'Server program',
  status: 'active',
  approved_minutes: 0,
  remaining_minutes: 120,
};
const result = (data = [enrollment], total = 1, totalPages = 1) => ({
  data: { data, meta: { total, totalPages } },
  isLoading: false,
  isFetching: false,
  isError: false,
  refetch,
});
const renderPage = (initialEntry = '/training-enrollments') =>
  renderWithRouter(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <TrainingEnrollmentsPage />
    </QueryClientProvider>,
    {
      initialEntry,
      routePattern: '/training-enrollments',
    },
  );

beforeEach(() => {
  ui.canViewAll = false;
  ui.legacyLabel = 'Historical record';
  useAuthStore.setState({
    user: {
      id: 'operator-a',
      email: 'operator@example.test',
      role: 'operator',
      company_id: 'company-a',
      branch_id: 'b1',
      branch_name: 'Branch one',
      branch_ids: ['b1'],
      access_version: 1,
      permissions: [
        {
          permission: 'training_enrollments.read',
          scope: 'branch',
          branch_id: 'b1',
        },
      ],
    },
    activeBranchId: 'b1',
  });
  enrollments.mockReturnValue(result());
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('training enrollment list server search', () => {
  it('renders authoritative server rows and total, debounces search and resets the page', async () => {
    await renderPage('/training-enrollments?q=needle&page=3&limit=50');
    expect(screen.getByText('Result Authoritative')).toBeInTheDocument();
    expect(enrollments).toHaveBeenLastCalledWith(
      expect.objectContaining({
        search: 'needle',
        page: 3,
        limit: 50,
        branchId: 'b1',
      }),
    );
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '100%_\\' },
    });
    expect(enrollments).not.toHaveBeenLastCalledWith(
      expect.objectContaining({ search: '100%_\\' }),
    );
    await waitFor(() =>
      expect(enrollments).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: '100%_\\', page: 1 }),
      ),
    );
    expect(screen.getByText('1–1 / 1')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '' } });
    await waitFor(() =>
      expect(enrollments).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: '', page: 1, searchLegacy: false }),
      ),
    );
  });

  it('restores search and page with Back and Forward navigation', async () => {
    const { router } = await renderPage('/training-enrollments?q=first&page=2');
    await act(() =>
      router.navigate({ href: '/training-enrollments?q=second&page=4' }),
    );
    await waitFor(() =>
      expect(enrollments).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'second', page: 4 }),
      ),
    );
    act(() => router.history.back());
    await waitFor(() =>
      expect(enrollments).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'first', page: 2 }),
      ),
    );
    act(() => router.history.forward());
    await waitFor(() =>
      expect(enrollments).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'second', page: 4 }),
      ),
    );
  });

  it.each(['Historical record', 'Tarixiy yozuv', 'Историческая запись'])(
    'searches the existing translated legacy label %s',
    async (label) => {
      ui.legacyLabel = label;
      await renderPage(
        `/training-enrollments?q=${encodeURIComponent(label.slice(0, 5))}`,
      );
      expect(enrollments).toHaveBeenLastCalledWith(
        expect.objectContaining({ searchLegacy: true }),
      );
    },
  );

  it('updates the legacy flag when language changes without changing the query', async () => {
    const view = await renderPage('/training-enrollments?q=historical');
    expect(enrollments).toHaveBeenLastCalledWith(
      expect.objectContaining({ searchLegacy: true }),
    );
    ui.legacyLabel = 'Историческая запись';
    view.rerender(
      <QueryClientProvider client={new QueryClient()}>
        <TrainingEnrollmentsPage />
      </QueryClientProvider>,
    );
    expect(enrollments).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'historical', searchLegacy: false }),
    );
  });

  it('keeps branch and status filters in searched requests and resets their page', async () => {
    ui.canViewAll = true;
    await renderPage('/training-enrollments?q=needle&page=3');
    fireEvent.change(screen.getByRole('combobox', { name: 'common.branch' }), {
      target: { value: 'b2' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'common.status' }), {
      target: { value: 'completed' },
    });
    await waitFor(() =>
      expect(enrollments).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: 'needle',
          branchId: 'b2',
          status: 'completed',
          page: 1,
        }),
      ),
    );
  });

  it('shows zero results without an enabled next page and offers retry on error', async () => {
    enrollments.mockReturnValue(result([], 0, 0));
    const view = await renderPage('/training-enrollments?q=none');
    expect(screen.getByText('common.no_data')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'common.next' }),
    ).not.toBeInTheDocument();
    enrollments.mockReturnValue({ ...result([], 0, 0), isError: true });
    view.rerender(
      <QueryClientProvider client={new QueryClient()}>
        <TrainingEnrollmentsPage />
      </QueryClientProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'common.retry' }));
    expect(refetch).toHaveBeenCalledOnce();
  });
});
