import {
  act,
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TrainingProgramsPage from '@/features/training/pages/TrainingProgramsPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from '@/api/axiosInstance';
import { useAuthStore } from '@/store/authStore';
import { initI18n, changeAppLanguage } from '@/i18n';
import { renderWithRouter } from '@/test/utils/renderWithRouter';

const { programs, branches, create, update } = vi.hoisted(() => ({
  programs: vi.fn(),
  branches: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}));
vi.mock('react-i18next', async () => vi.importActual('react-i18next'));
vi.mock('@/api/axiosInstance', () => ({ default: { get: vi.fn() } }));
vi.mock('@/features/branches/api/branchService', () => ({
  useBranches: branches,
}));
vi.mock('@/features/training/api/trainingService', () => ({
  useTrainingProgramsPage: programs,
  useCreateTrainingProgram: () => ({ isPending: false, mutate: create }),
  useUpdateTrainingProgram: () => ({ isPending: false, mutate: update }),
}));

beforeEach(() => {
  useAuthStore.setState({ user: null, activeBranchId: null });
  branches.mockReturnValue({
    data: [],
    isFetching: false,
    isError: false,
    refetch: vi.fn(),
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('training program server search', () => {
  it('passes debounced URL search and renders authoritative server rows without filtering the page again', async () => {
    programs.mockReturnValue({
      data: {
        data: [
          {
            id: 'late-match',
            name: 'Authoritative result',
            category: 'B',
            course_type: 'tezkor',
            branch_id: 'b1',
            required_minutes: 120,
            is_active: true,
          },
        ],
        meta: { total: 1, totalPages: 1 },
      },
      isLoading: false,
    });
    const { router } = await renderWithRouter(<TrainingProgramsPage />, {
      initialEntry: '/training-programs?q=needle&page=3',
      routePattern: '/training-programs',
    });
    expect(screen.getByText('Authoritative result')).toBeInTheDocument();
    expect(programs).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'needle', page: 3 }),
    );
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'AVTO_%\\' },
    });
    await waitFor(() =>
      expect(programs).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'AVTO_%\\', page: 1 }),
      ),
    );
    expect(router.state.location.search).toEqual(
      expect.objectContaining({ q: 'AVTO_%\\' }),
    );
  });
});

describe('training program create branch permissions', () => {
  let client: QueryClient;
  let catalogueBranches: Array<{ id: string; name: string }>;
  let failCatalogue: boolean;
  let failOptions: boolean;
  let pendingOptions: boolean;

  beforeEach(async () => {
    await initI18n();
    await changeAppLanguage('en');
    catalogueBranches = [{ id: 'a', name: 'Permitted A' }];
    failCatalogue = false;
    failOptions = false;
    pendingOptions = false;
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    useAuthStore.setState({
      user: {
        id: 'writer',
        email: 'synthetic@example.com',
        role: 'operator',
        company_id: 'company',
        branch_id: 'home',
        branch_ids: ['home', 'a', 'b'],
        access_version: 1,
        permissions: [
          {
            permission: 'training_programs.create',
            scope: 'branch',
            branch_id: 'a',
          },
        ],
      },
      activeBranchId: null,
    });
    programs.mockReturnValue({
      data: { data: [], meta: { total: 0, totalPages: 1 } },
      isLoading: false,
    });
    vi.mocked(axios.get).mockImplementation(async (url, config) => {
      if (url === '/permissions') {
        if (failCatalogue) throw new Error('Catalogue unavailable');
        return {
          data: {
            branches: catalogueBranches,
            permissions: [],
            templates: {},
            delegations: [],
            own_resources: [],
          },
        };
      }
      if (pendingOptions) return new Promise(() => {});
      if (failOptions) throw new Error('Branch unavailable');
      const selected = catalogueBranches.find(
        (branch) => branch.id === config?.params.branchId,
      );
      return { data: { branches: selected ? [selected] : [] } };
    });
  });

  afterEach(() => client.clear());

  const openCreate = async () => {
    const result = await renderWithRouter(
      <QueryClientProvider client={client}>
        <TrainingProgramsPage />
      </QueryClientProvider>,
      {
        initialEntry: '/training-programs',
        routePattern: '/training-programs',
      },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add program' }));
    return result;
  };
  const branchSelect = () =>
    within(screen.getByRole('dialog')).getByRole('combobox', {
      name: 'Branch',
    });
  const save = () =>
    within(screen.getByRole('dialog')).getByRole('button', { name: 'Save' });
  const fill = () => {
    fireEvent.change(screen.getByRole('textbox', { name: 'Program name' }), {
      target: { value: 'Synthetic program' },
    });
    fireEvent.change(screen.getByRole('spinbutton'), {
      target: { value: '120' },
    });
  };

  it('preselects the unique permitted branch and sends branch_id without requesting the branch directory', async () => {
    useAuthStore.setState({ activeBranchId: 'home' });
    catalogueBranches.push(
      { id: 'home', name: 'Denied home' },
      { id: 'foreign', name: 'Other company' },
    );
    await openCreate();
    await waitFor(() => expect(save()).toBeEnabled());
    expect(branchSelect()).toHaveValue('a');
    expect(
      screen.queryByRole('option', { name: 'Denied home' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: 'Other company' }),
    ).not.toBeInTheDocument();
    expect(branches).toHaveBeenCalledWith(false);
    expect(axios.get).not.toHaveBeenCalledWith('/branches', expect.anything());
    expect(axios.get).toHaveBeenCalledWith(
      '/permissions/options',
      expect.objectContaining({
        params: {
          resource: 'training_programs',
          action: 'create',
          branchId: 'a',
        },
      }),
    );
    fill();
    fireEvent.click(save());
    expect(create).toHaveBeenCalledWith(
      {
        branch_id: 'a',
        name: 'Synthetic program',
        course_type: 'avto_maktab',
        category: 'B',
        required_minutes: 120,
      },
      expect.anything(),
    );
    expect(update).not.toHaveBeenCalled();
  });

  it('requires a conscious choice when multiple branches are permitted', async () => {
    catalogueBranches.push({ id: 'b', name: 'Permitted B' });
    useAuthStore.setState({
      user: {
        ...useAuthStore.getState().user!,
        permissions: [
          {
            permission: 'training_programs.create',
            scope: 'company',
            branch_id: null,
          },
        ],
      },
    });
    await openCreate();
    await screen.findByRole('option', { name: 'Permitted B' });
    expect(branchSelect()).toHaveValue('');
    expect(save()).toBeDisabled();
    expect(axios.get).not.toHaveBeenCalledWith(
      '/permissions/options',
      expect.anything(),
    );
    fireEvent.change(branchSelect(), { target: { value: 'b' } });
    await waitFor(() => expect(save()).toBeEnabled());
    fill();
    fireEvent.click(save());
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ branch_id: 'b' }),
      expect.anything(),
    );
  });

  it('blocks empty choices and exposes catalogue errors with a working retry', async () => {
    failCatalogue = true;
    await openCreate();
    await screen.findByRole('alert');
    expect(save()).toBeDisabled();
    failCatalogue = false;
    catalogueBranches = [];
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await screen.findByText('No data found');
    expect(branchSelect()).toHaveValue('');
    expect(save()).toBeDisabled();
    expect(create).not.toHaveBeenCalled();
  });

  it('blocks pending or rejected active-branch validation and allows retry', async () => {
    pendingOptions = true;
    await openCreate();
    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith(
        '/permissions/options',
        expect.anything(),
      ),
    );
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    expect(save()).toBeDisabled();
    pendingOptions = false;
    failOptions = true;
    await act(async () => {
      await client.cancelQueries({ queryKey: ['permission-options'] });
    });
    await act(async () => {
      await client.refetchQueries({ queryKey: ['permission-options'] });
    });
    await screen.findByRole('alert');
    expect(save()).toBeDisabled();
    failOptions = false;
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(save()).toBeEnabled());
  });

  it('clears a revoked selection and prevents stale metadata after access or user changes', async () => {
    catalogueBranches.push({ id: 'b', name: 'Permitted B' });
    useAuthStore.setState({
      user: {
        ...useAuthStore.getState().user!,
        permissions: [
          {
            permission: 'training_programs.create',
            scope: 'company',
            branch_id: null,
          },
        ],
      },
    });
    await openCreate();
    await screen.findByRole('option', { name: 'Permitted B' });
    fireEvent.change(branchSelect(), { target: { value: 'b' } });
    await waitFor(() => expect(save()).toBeEnabled());
    act(() =>
      useAuthStore.setState({
        user: {
          ...useAuthStore.getState().user!,
          permissions: [
            {
              permission: 'training_programs.create',
              scope: 'branch',
              branch_id: 'a',
            },
          ],
        },
      }),
    );
    await waitFor(() => expect(branchSelect()).toHaveValue('a'));
    expect(
      screen.queryByRole('option', { name: 'Permitted B' }),
    ).not.toBeInTheDocument();
    catalogueBranches = [];
    act(() =>
      useAuthStore.setState({
        user: {
          ...useAuthStore.getState().user!,
          id: 'other-writer',
          company_id: 'other-company',
          access_version: 2,
        },
      }),
    );
    await screen.findByText('No data found');
    expect(branchSelect()).toHaveValue('');
    expect(save()).toBeDisabled();
    expect(
      screen.queryByRole('option', { name: 'Permitted A' }),
    ).not.toBeInTheDocument();
  });

  it('keeps scoped update-only editing independent from create options', async () => {
    useAuthStore.setState({
      user: {
        ...useAuthStore.getState().user!,
        permissions: [
          {
            permission: 'training_programs.update',
            scope: 'branch',
            branch_id: 'a',
          },
        ],
      },
    });
    programs.mockReturnValue({
      data: {
        data: [
          {
            id: 'program',
            name: 'Existing program',
            branch_id: 'a',
            category: 'B',
            course_type: 'tezkor',
            required_minutes: 90,
            is_active: true,
          },
        ],
        meta: { total: 1, totalPages: 1 },
      },
      isLoading: false,
    });
    await renderWithRouter(
      <QueryClientProvider client={client}>
        <TrainingProgramsPage />
      </QueryClientProvider>,
      {
        initialEntry: '/training-programs',
        routePattern: '/training-programs',
      },
    );
    expect(
      screen.queryByRole('button', { name: 'Add program' }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(
      screen.queryByRole('combobox', { name: 'Branch' }),
    ).not.toBeInTheDocument();
    fireEvent.click(save());
    expect(update).toHaveBeenCalledWith(
      {
        id: 'program',
        name: 'Existing program',
        required_minutes: 90,
        is_active: true,
      },
      expect.anything(),
    );
    expect(create).not.toHaveBeenCalled();
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('preserves legacy branch choices and update payloads without a branch change', async () => {
    useAuthStore.setState({
      user: { id: 'owner', email: 'owner@example.com', role: 'owner' },
    });
    branches.mockReturnValue({
      data: [{ id: 'a', name: 'Legacy A' }],
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    });
    const result = await openCreate();
    expect(branchSelect()).toHaveValue('a');
    fill();
    fireEvent.click(save());
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ branch_id: 'a' }),
      expect.anything(),
    );
    expect(axios.get).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    programs.mockReturnValue({
      data: {
        data: [
          {
            id: 'program',
            name: 'Existing program',
            branch_id: 'a',
            category: 'B',
            course_type: 'tezkor',
            required_minutes: 90,
            is_active: true,
          },
        ],
        meta: { total: 1, totalPages: 1 },
      },
      isLoading: false,
    });
    result.rerender(
      <QueryClientProvider client={client}>
        <TrainingProgramsPage />
      </QueryClientProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(
      screen.queryByRole('combobox', { name: 'Branch' }),
    ).not.toBeInTheDocument();
    fireEvent.click(save());
    expect(update).toHaveBeenCalledWith(
      {
        id: 'program',
        name: 'Existing program',
        required_minutes: 90,
        is_active: true,
      },
      expect.anything(),
    );
  });
});
