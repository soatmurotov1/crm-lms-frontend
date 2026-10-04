import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import axiosInstance from '@/api/axiosInstance';
import QuestionsPage from '@/features/questions/pages/QuestionsPage';
import { renderWithRouter } from '@/test/utils/renderWithRouter';

vi.mock('@/api/axiosInstance', () => ({ default: { get: vi.fn() } }));
vi.mock('@/store/authStore', () => ({
  useAuthStore: Object.assign(
    (select: (state: unknown) => unknown) =>
      select({
        user: { role: 'teacher', branch_id: 'branch-a' },
        activeBranchId: 'branch-a',
      }),
    { getState: () => ({ activeBranchId: 'branch-a' }) },
  ),
}));
vi.mock('@/hooks/useCan', () => ({ useCan: () => false }));
vi.mock('@/features/branches/api/branchService', () => ({
  useBranches: () => ({ data: [] }),
}));
vi.mock('@/features/questions/components/QuestionFormDialog', () => ({
  QuestionFormDialog: () => null,
}));

const envelope = (stem: string | null, total = stem ? 1 : 0) => ({
  data: {
    success: true,
    data: {
      data: stem
        ? [
            {
              id: stem,
              topic: 'signals',
              category: 'B',
              status: 'draft',
              visibility: 'school_private',
              draft_version: { locales: [{ locale: 'uz', stem }] },
            },
          ]
        : [],
      meta: { total, page: 1, limit: 10, totalPages: Math.ceil(total / 10) },
    },
  },
});

const mount = async (entry = '/questions') => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return renderWithRouter(
    <QueryClientProvider client={client}>
      <QuestionsPage />
    </QueryClientProvider>,
    { routePattern: '/questions', initialEntry: entry },
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('question list server search', () => {
  it('renders a server match beyond the first page and uses searched totals', async () => {
    vi.mocked(axiosInstance.get).mockResolvedValue(
      envelope('Late question 501'),
    );
    await mount('/questions?q=target');
    expect(await screen.findByText('Late question 501')).toBeInTheDocument();
    expect(screen.getByText('1–1 / 1')).toBeInTheDocument();
    expect(axiosInstance.get).toHaveBeenCalledWith(
      '/questions',
      expect.objectContaining({
        params: expect.objectContaining({
          search: 'target',
          page: 1,
          branch_id: 'branch-a',
          visibility: 'school_private',
          limit: 10,
        }),
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it('resets page on search, debounces requests, then restores the cohort on clear', async () => {
    vi.mocked(axiosInstance.get).mockImplementation(async (_url, config) =>
      envelope(
        config?.params.search ? 'Matched question' : 'Cohort question',
        config?.params.search ? 1 : 501,
      ),
    );
    const { router } = await mount('/questions?page=2');
    await screen.findByText('Cohort question');
    fireEvent.change(screen.getByRole('textbox', { name: 'common.search' }), {
      target: { value: 'target' },
    });
    await waitFor(() =>
      expect(router.state.location.searchStr).toContain('q=target'),
    );
    expect(router.state.location.searchStr).not.toContain('page=2');
    expect(screen.queryByText('Cohort question')).not.toBeInTheDocument();
    await screen.findByText('Matched question');
    expect(screen.getByText('1–1 / 1')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: 'common.search' }), {
      target: { value: '' },
    });
    await screen.findByText('Cohort question');
    expect(screen.getByText('1–10 / 501')).toBeInTheDocument();
  });

  it('shows empty search and removes forward navigation for zero total', async () => {
    vi.mocked(axiosInstance.get).mockResolvedValue(envelope(null));
    await mount('/questions?q=missing');
    expect(await screen.findByText('common.no_data')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'common.next' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/\/ 501/)).not.toBeInTheDocument();
  });

  it('does not show a delayed old result after a newer search settles', async () => {
    let finishOld!: (value: ReturnType<typeof envelope>) => void;
    vi.mocked(axiosInstance.get).mockImplementation((_url, config) =>
      config?.params.search === 'old'
        ? new Promise((resolve) => {
            finishOld = resolve;
          })
        : Promise.resolve(envelope('New result')),
    );
    await mount('/questions?q=old');
    await waitFor(() => expect(finishOld).toBeTypeOf('function'));
    fireEvent.change(screen.getByRole('textbox', { name: 'common.search' }), {
      target: { value: 'new' },
    });
    await screen.findByText('New result');
    await act(async () => finishOld(envelope('Old result')));
    expect(screen.queryByText('Old result')).not.toBeInTheDocument();
    expect(screen.getByText('New result')).toBeInTheDocument();
  });

  it('offers retry for a failed query', async () => {
    vi.mocked(axiosInstance.get)
      .mockRejectedValueOnce(new Error('synthetic connection failure'))
      .mockResolvedValue(envelope('Recovered question'));
    await mount('/questions?q=target');
    expect(await screen.findByRole('alert')).toHaveTextContent('common.error');
    fireEvent.click(screen.getByRole('button', { name: 'common.retry' }));
    expect(await screen.findByText('Recovered question')).toBeInTheDocument();
  });

  it('restores query/page through history back and forward', async () => {
    vi.mocked(axiosInstance.get).mockImplementation(async (_url, config) =>
      envelope(`Result ${config?.params.search} page ${config?.params.page}`),
    );
    const { router } = await mount('/questions?q=first&page=2');
    await screen.findByText('Result first page 2');
    await act(async () => {
      await router.navigate({ href: '/questions?q=second&page=3' });
    });
    await screen.findByText('Result second page 3');
    await act(async () => router.history.back());
    await screen.findByText('Result first page 2');
    await act(async () => router.history.forward());
    await screen.findByText('Result second page 3');
  });
});
