import {
  act,
  cleanup,
  fireEvent,
  screen,
  waitFor,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axiosInstance from '@/api/axiosInstance';
import SchoolTestsPage from '@/features/school-tests/pages/SchoolTestsPage';
import { renderWithRouter } from '@/test/utils/renderWithRouter';

vi.mock('@/api/axiosInstance', () => ({ default: { get: vi.fn() } }));
vi.mock('@/hooks/useCan', () => ({ useCan: () => false }));
vi.mock('@/features/branches/api/branchService', () => ({
  useBranches: () => ({ data: [] }),
}));
vi.mock('@/features/school-tests/components/TestTemplateFormDialog', () => ({
  TestTemplateFormDialog: () => null,
}));

const template = (id: string, title: string) => ({
  id,
  title,
  description: null,
  category: 'B',
  status: 'draft',
  question_count: 1,
  passing_threshold_percent: 80,
  time_limit_seconds: 60,
});
const envelope = (title: string | null, total = title ? 1 : 0, page = 1) => ({
  data: {
    data: title ? [template(`id-${title}`, title)] : [],
    meta: {
      total,
      page,
      limit: 10,
      totalPages: Math.ceil(total / 10),
      hasNextPage: page * 10 < total,
      hasPreviousPage: page > 1,
    },
  },
});
const clients: QueryClient[] = [];
async function renderPage(url = '/school-tests') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  clients.push(client);
  return renderWithRouter(
    <QueryClientProvider client={client}>
      <SchoolTestsPage />
    </QueryClientProvider>,
    {
      initialEntry: url,
      routePattern: '/school-tests',
    },
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.mocked(axiosInstance.get)
    .mockReset()
    .mockResolvedValue(envelope('Original', 61));
});
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
});

describe('SchoolTestsPage server search', () => {
  it('sends debounced search, resets page, renders server rows/count, and clears cohort', async () => {
    vi.mocked(axiosInstance.get).mockImplementation(async (_url, config) =>
      config?.params.search
        ? envelope('Server result', 41)
        : envelope('Original', 61, config?.params.page),
    );
    const { router } = await renderPage('/school-tests?page=2');
    await screen.findByText('Original');
    const input = screen.getByRole('textbox', { name: 'common.search' });
    fireEvent.change(input, { target: { value: 'needle' } });
    expect(screen.queryByText('Original')).toBeNull();
    expect(screen.getByRole('status')).toBeInTheDocument();
    await screen.findByText('Server result');
    expect(router.state.location.searchStr).not.toContain('page=2');
    expect(axiosInstance.get).toHaveBeenLastCalledWith(
      '/tests/templates',
      expect.objectContaining({
        params: { search: 'needle', page: 1, limit: 10 },
      }),
    );
    expect(screen.getByText('1–10 / 41')).toBeInTheDocument();
    fireEvent.change(input, { target: { value: '' } });
    await screen.findByText('Original');
    expect(screen.getByText('1–10 / 61')).toBeInTheDocument();
  });

  it('shows zero server results and prevents moving to a next page', async () => {
    vi.mocked(axiosInstance.get).mockResolvedValue(envelope(null));
    await renderPage('/school-tests?q=absent');
    await screen.findByText('common.no_data');
    expect(
      screen.getByRole('navigation', { name: 'common.pagination' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'common.next' })).toBeNull();
  });

  it('reports a failed search with retry rather than an empty cohort', async () => {
    vi.mocked(axiosInstance.get)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(envelope('Recovered'));
    await renderPage('/school-tests?q=retry');
    await screen.findByRole('alert');
    expect(screen.queryByText('common.no_data')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'common.retry' }));
    await screen.findByText('Recovered');
  });

  it('does not show a late A response after B settles and cancels the A signal', async () => {
    let resolveA!: (value: ReturnType<typeof envelope>) => void;
    let signalA: AbortSignal | undefined;
    vi.mocked(axiosInstance.get).mockImplementation((_url, config) => {
      if (config?.params.search === 'A') {
        signalA = config.signal as AbortSignal;
        return new Promise((resolve) => {
          resolveA = resolve;
        });
      }
      return Promise.resolve(
        envelope(config?.params.search === 'B' ? 'B result' : 'Original'),
      );
    });
    await renderPage();
    await screen.findByText('Original');
    const input = screen.getByRole('textbox', { name: 'common.search' });
    fireEvent.change(input, { target: { value: 'A' } });
    await waitFor(() => expect(resolveA).toBeDefined());
    fireEvent.change(input, { target: { value: 'B' } });
    await screen.findByText('B result');
    expect(signalA?.aborted).toBe(true);
    await act(async () => resolveA(envelope('A result', 99)));
    expect(screen.queryByText('A result')).toBeNull();
    expect(screen.getByText('B result')).toBeInTheDocument();
  });

  it('restores URL query and page on back/forward navigation', async () => {
    vi.mocked(axiosInstance.get).mockImplementation(async (_url, config) =>
      envelope(
        `${config?.params.search ?? 'all'} page ${config?.params.page}`,
        61,
        config?.params.page,
      ),
    );
    const { router } = await renderPage('/school-tests?q=first&page=2');
    await screen.findByText('first page 2');
    await act(async () => {
      await router.navigate({ href: '/school-tests?q=second&page=3' });
    });
    await screen.findByText('second page 3');
    await act(async () => router.history.back());
    await screen.findByText('first page 2');
    expect(screen.getByRole('textbox')).toHaveValue('first');
    await act(async () => router.history.forward());
    await screen.findByText('second page 3');
    expect(screen.getByRole('textbox')).toHaveValue('second');
  });
});
