import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TrainingEnrollmentsPage from '@/features/training/pages/TrainingEnrollmentsPage';
import { useAuthStore } from '@/store/authStore';
import { useWriteOptions, type WriteOptions } from '@/hooks/useWriteOptions';
import { searchStudents } from '@/features/students/api/studentService';

const actions = vi.hoisted(() => ({
  create: vi.fn(),
  refetch: vi.fn(),
  pending: false,
  programError: false,
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: { shown: number; total: number }) =>
      values ? `${key} ${values.shown} / ${values.total}` : key,
  }),
}));
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@/hooks/useWriteOptions', () => ({ useWriteOptions: vi.fn() }));
vi.mock('@/features/students/api/studentService', () => ({
  searchStudents: vi.fn(async () => []),
}));
vi.mock('@/features/branches/api/branchService', () => ({
  useBranches: () => ({
    data: [
      { id: 'b1', name: 'Branch one' },
      { id: 'b2', name: 'Branch two' },
    ],
  }),
}));
vi.mock('@/hooks/useListQueryState', () => ({
  useListQueryState: () => ({
    page: 1,
    pageSize: 20,
    search: '',
    debouncedSearch: '',
    setPage: vi.fn(),
    setPageSize: vi.fn(),
    setSearch: vi.fn(),
  }),
}));
vi.mock('@/features/training/api/trainingService', () => ({
  useActiveTrainingPrograms: () => ({
    data: [],
    isError: actions.programError,
  }),
  useCreateTrainingEnrollment: () => ({
    mutate: actions.create,
    isPending: actions.pending,
  }),
  useTrainingEnrollmentsPage: () => ({
    data: { data: [], meta: { total: 0, totalPages: 1 } },
  }),
}));
vi.mock('@/shared/ui/data-grid', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  DataGrid: () => null,
}));

const students: NonNullable<WriteOptions['students']> = [
  {
    id: 'student-one',
    first_name: 'Aziz',
    last_name: 'Karimov',
    branch_id: 'b1',
    phone_last4: '4567',
    group_name: 'B-1',
  },
  {
    id: 'student-two',
    first_name: 'Aziz',
    last_name: 'Karimov',
    branch_id: 'b1',
    phone_last4: '4567',
    group_name: 'B-2',
  },
];
const programs = [
  {
    id: 'program-one',
    name: 'Practice B',
    branch_id: 'b1',
    required_minutes: 120,
    category: 'B',
  },
];
let lookup: ReturnType<typeof useWriteOptions>;
let client: QueryClient;

beforeEach(() => {
  vi.clearAllMocks();
  actions.pending = false;
  actions.programError = false;
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  useAuthStore.setState({
    user: {
      id: 'synthetic-user',
      email: 'synthetic@example.test',
      role: 'owner',
      permissions: [],
      access_version: 1,
    },
    activeBranchId: 'b1',
  });
  lookup = {
    scoped: true,
    selectedBranchId: 'b1',
    branches: [{ id: 'b1', name: 'Branch one' }],
    data: { students, programs, students_total: 120 },
    isFetching: false,
    isError: false,
    isPlaceholderData: false,
    refetch: actions.refetch,
  } as unknown as ReturnType<typeof useWriteOptions>;
  vi.mocked(useWriteOptions).mockImplementation(() => lookup);
});
afterEach(() => {
  cleanup();
  client.clear();
});

const openDialog = () => {
  const view = render(
    <QueryClientProvider client={client}>
      <TrainingEnrollmentsPage />
    </QueryClientProvider>,
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'training.add_enrollment' }),
  );
  return {
    ...view,
    refresh: () =>
      view.rerender(
        <QueryClientProvider client={client}>
          <TrainingEnrollmentsPage />
        </QueryClientProvider>,
      ),
  };
};
const search = () =>
  screen.getByLabelText('training.find_student', { selector: 'input' });
const pickFirst = async () => {
  fireEvent.change(search(), { target: { value: '4567' } });
  await waitFor(() =>
    expect(
      within(screen.getByRole('listbox')).getAllByRole('option'),
    ).toHaveLength(2),
  );
  fireEvent.click(
    within(screen.getByRole('listbox')).getAllByRole('option')[0],
  );
  fireEvent.change(screen.getByLabelText('training.program'), {
    target: { value: 'program-one' },
  });
};

describe('Enrollment student identity', () => {
  it('invalidates selection immediately after the search text changes', async () => {
    openDialog();
    await pickFirst();
    expect(screen.getByRole('button', { name: 'common.save' })).toBeEnabled();
    fireEvent.change(search(), { target: { value: 'Another student' } });
    expect(screen.getByRole('button', { name: 'common.save' })).toBeDisabled();
    fireEvent.submit(search().closest('form')!);
    expect(actions.create).not.toHaveBeenCalled();
  });

  it('clears the selection and draft after cancel and reopen', async () => {
    openDialog();
    await pickFirst();
    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'training.add_enrollment' }),
    );
    expect(search()).toHaveValue('');
    expect(screen.getByLabelText('training.program')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'common.save' })).toBeDisabled();
  });

  it('hides previous results throughout the debounce and network delay', async () => {
    const view = openDialog();
    fireEvent.change(search(), { target: { value: '4567' } });
    await screen.findByRole('listbox');
    fireEvent.change(search(), { target: { value: '9999' } });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    lookup = { ...lookup, isFetching: true };
    view.refresh();
    await waitFor(() =>
      expect(vi.mocked(useWriteOptions).mock.calls.at(-1)?.[4]?.search).toBe(
        '9999',
      ),
    );
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('never calls the broad student API for scoped users, even with read permission', async () => {
    openDialog();
    fireEvent.change(search(), { target: { value: '4567' } });
    await waitFor(() =>
      expect(vi.mocked(useWriteOptions).mock.calls.at(-1)?.[4]?.search).toBe(
        '4567',
      ),
    );
    expect(searchStudents).not.toHaveBeenCalled();
  });
});

describe('Enrollment lookup states and keyboard behavior', () => {
  it('shows masked phone, group and matching total, with an ID fallback for identical labels', async () => {
    const colliding = { ...students[0], id: 'student-three' };
    lookup = {
      ...lookup,
      data: {
        ...lookup.data,
        students: [...students, colliding],
        students_total: 501,
      },
    };
    openDialog();
    fireEvent.change(search(), { target: { value: '4567' } });
    const list = await screen.findByRole('listbox');
    expect(
      within(list).getByRole('option', {
        name: 'Karimov Aziz · •• 4567 · B-1 · student-one',
      }),
    ).toBeInTheDocument();
    expect(
      within(list).getByRole('option', {
        name: 'Karimov Aziz · •• 4567 · B-1 · student-three',
      }),
    ).toBeInTheDocument();
    expect(
      within(list).getByRole('option', {
        name: 'Karimov Aziz · •• 4567 · B-2',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('training.student_lookup_truncated 3 / 501'),
    ).toBeInTheDocument();
  });

  it('selects by arrows and Enter without submitting, Escape closes only the popup and Tab preserves selection', async () => {
    openDialog();
    const input = search();
    fireEvent.change(input, { target: { value: '4567' } });
    await screen.findByRole('listbox');
    expect(input).toHaveAttribute('role', 'combobox');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    const firstId = within(screen.getByRole('listbox')).getAllByRole(
      'option',
    )[0].id;
    expect(input).toHaveAttribute('aria-activedescendant', firstId);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input).toHaveAttribute('aria-activedescendant', firstId);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByText('training.selected_student:')).toBeInTheDocument();
    expect(actions.create).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input).toHaveAttribute(
      'aria-controls',
      screen.getByRole('listbox').id,
    );
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(input, { key: 'Tab' });
    fireEvent.change(screen.getByLabelText('training.program'), {
      target: { value: 'program-one' },
    });
    expect(screen.getByRole('button', { name: 'common.save' })).toBeEnabled();
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(actions.create).not.toHaveBeenCalled();
  });

  it('offers one Tab option and Space selects its actual payload without submitting', async () => {
    openDialog();
    fireEvent.change(search(), { target: { value: '4567' } });
    const list = await screen.findByRole('listbox');
    const choices = within(list).getAllByRole('option');
    expect(choices.filter((choice) => choice.tabIndex === 0)).toHaveLength(1);
    fireEvent.keyDown(search(), { key: 'Tab' });
    fireEvent.blur(search(), { relatedTarget: choices[0] });
    act(() => choices[0].focus());
    fireEvent.keyDown(choices[0], { key: ' ' });
    expect(screen.getByText('training.selected_student:')).toBeInTheDocument();
    expect(search()).toHaveFocus();
    expect(search()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(actions.create).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('training.program'), {
      target: { value: 'program-one' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'common.save' }));
    expect(actions.create).toHaveBeenCalledWith(
      { student_id: 'student-one', program_id: 'program-one' },
      expect.any(Object),
    );
  });

  it('keeps Space as search text and invalidates the selected identity', async () => {
    openDialog();
    await pickFirst();
    fireEvent.keyDown(search(), { key: ' ' });
    fireEvent.change(search(), { target: { value: '4567 ' } });
    expect(screen.getByRole('button', { name: 'common.save' })).toBeDisabled();
    expect(
      screen.queryByText('training.selected_student:'),
    ).not.toBeInTheDocument();
  });

  it('distinguishes loading, errors, retry and empty results while preserving the chosen program', async () => {
    const view = openDialog();
    await pickFirst();
    fireEvent.change(search(), { target: { value: 'No match' } });
    expect(screen.getByText('common.loading')).toBeInTheDocument();
    lookup = { ...lookup, isError: true };
    view.refresh();
    await screen.findByText('training.student_lookup_failed');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByLabelText('training.program')).toHaveValue(
      'program-one',
    );
    fireEvent.click(screen.getByRole('button', { name: 'common.retry' }));
    expect(actions.refetch).toHaveBeenCalledTimes(1);
    lookup = {
      ...lookup,
      isError: false,
      data: { programs, students: [], students_total: 0 },
    };
    view.refresh();
    expect(
      screen.getByText('training.student_lookup_empty'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'common.save' })).toBeDisabled();
  });

  it('blocks cached results on error and placeholder responses', async () => {
    const view = openDialog();
    await pickFirst();
    lookup = { ...lookup, isPlaceholderData: true } as unknown as ReturnType<
      typeof useWriteOptions
    >;
    view.refresh();
    expect(screen.getByRole('button', { name: 'common.save' })).toBeDisabled();
    fireEvent.submit(search().closest('form')!);
    lookup = { ...lookup, isPlaceholderData: false, isError: true };
    view.refresh();
    expect(screen.getByRole('button', { name: 'common.save' })).toBeDisabled();
    expect(
      screen.queryByText('training.selected_student:'),
    ).not.toBeInTheDocument();
    fireEvent.submit(search().closest('form')!);
    expect(actions.create).not.toHaveBeenCalled();
  });
});

describe('Enrollment scope and submission', () => {
  it('resets student and program after external branch changes', async () => {
    openDialog();
    await pickFirst();
    act(() => useAuthStore.setState({ activeBranchId: 'b2' }));
    expect(search()).toHaveValue('');
    expect(screen.getByLabelText('training.program')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'common.save' })).toBeDisabled();
    fireEvent.submit(search().closest('form')!);
    expect(actions.create).not.toHaveBeenCalled();
  });

  it('resets selected identity when access changes and hides cached rows on revoked create access', async () => {
    useAuthStore.setState({
      user: {
        id: 'limited',
        email: 'synthetic@example.test',
        role: 'operator',
        branch_id: 'b1',
        branch_ids: ['b1'],
        access_version: 1,
        permissions: [
          {
            permission: 'training_enrollments.create',
            scope: 'branch',
            branch_id: 'b1',
          },
        ],
      },
    });
    openDialog();
    await pickFirst();
    act(() =>
      useAuthStore.setState({
        user: {
          ...useAuthStore.getState().user!,
          access_version: 2,
          permissions: [],
        },
      }),
    );
    expect(search()).toBeDisabled();
    expect(
      screen.getByText('training.student_lookup_forbidden'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'common.save' })).toBeDisabled();
    fireEvent.submit(search().closest('form')!);
    expect(actions.create).not.toHaveBeenCalled();
    expect(searchStudents).not.toHaveBeenCalled();
  });

  it('accepts an authorized company-scope student outside the historical home branch', async () => {
    useAuthStore.setState({
      user: {
        id: 'company-user',
        email: 'synthetic@example.test',
        role: 'operator',
        branch_id: 'b1',
        branch_ids: ['b1', 'b2'],
        permissions: [
          {
            permission: 'training_enrollments.create',
            scope: 'company',
            branch_id: null,
          },
        ],
      },
    });
    lookup = {
      ...lookup,
      data: {
        ...lookup.data,
        students: [{ ...students[0], branch_id: 'b2' }, students[1]],
      },
    };
    openDialog();
    await pickFirst();
    fireEvent.click(screen.getByRole('button', { name: 'common.save' }));
    expect(actions.create).toHaveBeenCalledWith(
      { student_id: 'student-one', program_id: 'program-one' },
      expect.any(Object),
    );
  });

  it('rejects a removed program and repeated submit, keeps pending work open, then resets on success', async () => {
    const view = openDialog();
    await pickFirst();
    lookup = { ...lookup, data: { ...lookup.data, programs: [] } };
    view.refresh();
    fireEvent.submit(search().closest('form')!);
    expect(actions.create).not.toHaveBeenCalled();
    lookup = { ...lookup, data: { ...lookup.data, programs } };
    view.refresh();
    fireEvent.submit(search().closest('form')!);
    fireEvent.submit(search().closest('form')!);
    expect(actions.create).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'common.close' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    act(() => actions.create.mock.calls[0][1].onSuccess());
    fireEvent.click(
      screen.getByRole('button', { name: 'training.add_enrollment' }),
    );
    expect(search()).toHaveValue('');
    expect(screen.getByLabelText('training.program')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'common.save' })).toBeDisabled();
  });

  it('resets after the dialog close button and Escape dismissals', async () => {
    openDialog();
    await pickFirst();
    fireEvent.click(screen.getByRole('button', { name: 'common.close' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'training.add_enrollment' }),
    );
    expect(search()).toHaveValue('');
    await pickFirst();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    fireEvent.click(
      screen.getByRole('button', { name: 'training.add_enrollment' }),
    );
    expect(search()).toHaveValue('');
    expect(screen.getByRole('button', { name: 'common.save' })).toBeDisabled();
  });

  it('closes by pointer after search blur dismisses the popup and starts a fresh draft', async () => {
    openDialog();
    fireEvent.change(search(), { target: { value: '4567' } });
    await screen.findByRole('listbox');
    const close = screen.getByRole('button', { name: 'common.close' });
    fireEvent.pointerDown(close);
    fireEvent.blur(search(), { relatedTarget: close });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    fireEvent.pointerUp(close);
    fireEvent.click(close);
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'training.add_enrollment' }),
    );
    expect(search()).toHaveValue('');
    expect(screen.getByRole('button', { name: 'common.save' })).toBeDisabled();
  });

  it.each(['Cancel', 'Escape'])(
    'returns focus to the enrollment trigger after %s dismissal',
    async (dismissal) => {
      openDialog();
      await pickFirst();
      if (dismissal === 'Cancel')
        fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }));
      else fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'training.add_enrollment' }),
        ).toHaveFocus(),
      );
    },
  );

  it('does not close a new context when an older enrollment succeeds', async () => {
    openDialog();
    await pickFirst();
    fireEvent.submit(search().closest('form')!);
    const callbacks = actions.create.mock.calls[0][1];
    act(() => useAuthStore.setState({ activeBranchId: 'b2' }));
    fireEvent.change(search(), { target: { value: 'New draft' } });
    act(() => callbacks.onSuccess());
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(search()).toHaveValue('New draft');
  });

  it('ignores unrelated disabled legacy program errors in scoped lookup mode', async () => {
    actions.programError = true;
    openDialog();
    await pickFirst();
    expect(screen.getByRole('button', { name: 'common.save' })).toBeEnabled();
  });
});

describe('Enrollment recovery and current selection', () => {
  it('preserves the visible program while a new lookup has no cached data, including an error and retry', async () => {
    const view = openDialog();
    await pickFirst();
    fireEvent.change(search(), { target: { value: 'New lookup' } });
    lookup = { ...lookup, data: undefined, isFetching: true };
    view.refresh();
    expect(screen.getByLabelText('training.program')).toHaveValue(
      'program-one',
    );
    expect(
      screen.getByRole('option', { name: 'Practice B (B · 2h)' }),
    ).toBeInTheDocument();
    lookup = { ...lookup, isFetching: false, isError: true };
    view.refresh();
    await screen.findByText('training.student_lookup_failed');
    expect(screen.getByLabelText('training.program')).toHaveValue(
      'program-one',
    );
    expect(screen.getByRole('button', { name: 'common.save' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'common.retry' }));
    expect(actions.refetch).toHaveBeenCalledTimes(1);
    lookup = { ...lookup, data: { students, programs }, isError: false };
    view.refresh();
    expect(screen.getByLabelText('training.program')).toHaveValue(
      'program-one',
    );
  });

  it('resets the draft after an explicit branch selection', async () => {
    openDialog();
    await pickFirst();
    fireEvent.change(
      within(screen.getByRole('dialog')).getByLabelText('common.branch'),
      { target: { value: 'b2' } },
    );
    expect(search()).toHaveValue('');
    expect(screen.getByLabelText('training.program')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'common.save' })).toBeDisabled();
  });

  it('disallows a student removed by a settled refresh and allows retry after a rejected mutation', async () => {
    const view = openDialog();
    await pickFirst();
    lookup = { ...lookup, data: { ...lookup.data, students: [students[1]] } };
    view.refresh();
    fireEvent.submit(search().closest('form')!);
    expect(actions.create).not.toHaveBeenCalled();
    lookup = { ...lookup, data: { ...lookup.data, students } };
    view.refresh();
    fireEvent.submit(search().closest('form')!);
    expect(actions.create).toHaveBeenCalledTimes(1);
    act(() => actions.create.mock.calls[0][1].onSettled());
    fireEvent.submit(search().closest('form')!);
    expect(actions.create).toHaveBeenCalledTimes(2);
  });
});
