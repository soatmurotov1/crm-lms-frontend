import {
  act,
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import { vi, describe, it, expect, afterEach, beforeEach } from 'vitest';
import PaymentModal from '@/features/payments/api/PaymentModal';
import { useWriteOptions } from '@/hooks/useWriteOptions';
import { useAuthStore } from '@/store/authStore';
import { useStudentsPage } from '@/features/students/api/studentService';
import type { User } from '@/features/staff/types';

vi.mock('@/hooks/useWriteOptions', () => ({ useWriteOptions: vi.fn() }));
vi.mock('@/features/students/api/studentService', () => ({
  useStudentsPage: vi.fn(() => ({
    data: undefined,
    isFetching: false,
    isError: false,
  })),
}));

const student = {
  id: 'student-b1',
  first_name: 'Demo',
  last_name: 'Student',
  branch_id: 'b1',
  course_type: 'offline' as const,
  group_name: 'Demo group',
  phone_last4: '1234',
  total_price: 1000,
  amount_paid: 0,
};
const owner: User = {
  id: 'demo-owner',
  email: 'demo@example.test',
  role: 'owner',
  company_id: 'demo-company',
  permissions: [],
  access_version: 1,
};
const picker = () =>
  screen.getByRole('combobox', { name: 'payments.student_name' });
const fillAmount = (amount = '100') =>
  fireEvent.change(screen.getByPlaceholderText('0'), {
    target: { value: amount },
  });
const selectStudent = async () => {
  fireEvent.click(picker());
  fireEvent.click(await screen.findByRole('option', { name: /Demo group/ }));
};
const submit = () =>
  fireEvent.click(screen.getByRole('button', { name: 'common.add' }));

beforeEach(() => {
  useAuthStore.setState({ user: owner, activeBranchId: 'b1' });
  vi.mocked(useWriteOptions).mockImplementation(
    (_resource, _action, branchId) =>
      ({
        scoped: true,
        branches: [
          { id: 'b1', name: 'Demo branch 1' },
          { id: 'b2', name: 'Demo branch 2' },
        ],
        selectedBranchId: branchId ?? 'b1',
        data: { students: [student], students_total: 1 },
        isFetching: false,
        isError: false,
        refetch: vi.fn(),
      }) as unknown as ReturnType<typeof useWriteOptions>,
  );
});
afterEach(() => {
  cleanup();
  useAuthStore.setState({ user: null, activeBranchId: null });
});

describe('PaymentModal selection scope safety', () => {
  it.each([
    'branch prop',
    'active branch',
    'course',
    'access version',
    'user identity',
    'company identity',
    'permissions',
  ] as const)(
    'retires the selected student after a change to %s',
    async (change) => {
      const props = { open: true, onClose: vi.fn(), onSubmit: vi.fn() };
      const { rerender } = render(
        <PaymentModal
          {...props}
          branchId={change === 'active branch' ? undefined : 'b1'}
          courseType="offline"
        />,
      );
      await selectStudent();
      fillAmount();
      if (change === 'branch prop')
        rerender(
          <PaymentModal {...props} branchId="b2" courseType="offline" />,
        );
      else if (change === 'course')
        rerender(<PaymentModal {...props} branchId="b1" courseType="online" />);
      else
        act(() =>
          useAuthStore.setState(
            change === 'active branch'
              ? { activeBranchId: 'b2' }
              : {
                  user: {
                    ...owner,
                    ...(change === 'access version'
                      ? { access_version: 2 }
                      : change === 'user identity'
                        ? { id: 'other-owner' }
                        : change === 'company identity'
                          ? { company_id: 'other-company' }
                          : {
                              role: 'operator',
                              branch_ids: ['b1'],
                              permissions: [],
                            }),
                  },
                },
          ),
        );
      expect(picker()).toHaveTextContent('payments.validation.select_student');
      expect(screen.queryByText('Demo group')).not.toBeInTheDocument();
      fillAmount();
      submit();
      await act(async () => {});
      expect(props.onSubmit).not.toHaveBeenCalled();
    },
  );

  it('preserves the deliberate target through same-context refinement and absent limited results', async () => {
    const onSubmit = vi.fn();
    render(<PaymentModal open onClose={vi.fn()} onSubmit={onSubmit} />);
    await selectStudent();
    fillAmount();
    fireEvent.click(picker());
    fireEvent.change(screen.getByLabelText('payments.search_placeholder'), {
      target: { value: 'new student' },
    });
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
    fireEvent.keyDown(screen.getByLabelText('payments.search_placeholder'), {
      key: 'Enter',
    });
    fireEvent.keyDown(screen.getByLabelText('payments.search_placeholder'), {
      key: 'Escape',
    });
    expect(picker()).toHaveTextContent('Student Demo');
    vi.mocked(useWriteOptions).mockReturnValue({
      scoped: true,
      selectedBranchId: 'b1',
      branches: [],
      data: { students: [], students_total: 0 },
      isFetching: false,
      isError: false,
    } as unknown as ReturnType<typeof useWriteOptions>);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 320));
    });
    submit();
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ student_id: student.id, amount: 100 }),
      ),
    );
  });

  it('keeps a submitted draft open before the caller reports pending', async () => {
    const onClose = vi.fn();
    const onSubmit = vi.fn();
    render(<PaymentModal open onClose={onClose} onSubmit={onSubmit} />);
    await selectStudent();
    fillAmount();
    submit();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(
      screen.getByRole('button', { name: 'common.cancel' }),
    ).toBeDisabled();
    fireEvent.keyDown(screen.getByPlaceholderText('0'), { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByText('common.discard_title')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('preserves an explicit branch target when the unrelated store branch changes', async () => {
    const onSubmit = vi.fn();
    render(
      <PaymentModal open branchId="b1" onClose={vi.fn()} onSubmit={onSubmit} />,
    );
    await selectStudent();
    fillAmount();
    act(() => useAuthStore.setState({ activeBranchId: 'b2' }));
    expect(picker()).toHaveTextContent('Student Demo');
    submit();
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ student_id: student.id, amount: 100 }),
      ),
    );
  });

  it.each(['branch', 'course', 'close/reopen', 'access revocation'] as const)(
    'retires a pending exceeds-debt confirmation after %s',
    async (change) => {
      const props = { onClose: vi.fn(), onSubmit: vi.fn() };
      const { rerender } = render(
        <PaymentModal open {...props} branchId="b1" courseType="offline" />,
      );
      await selectStudent();
      fillAmount('1200');
      submit();
      await screen.findByText('payments.exceeds_debt_title');
      if (change === 'branch')
        rerender(
          <PaymentModal
            open
            {...props}
            branchId="b2"
            courseType="offline"
          />,
        );
      else if (change === 'course')
        rerender(
          <PaymentModal open {...props} branchId="b1" courseType="online" />,
        );
      else if (change === 'close/reopen') {
        rerender(
          <PaymentModal
            open={false}
            {...props}
            branchId="b1"
            courseType="offline"
          />,
        );
        rerender(
          <PaymentModal
            open
            {...props}
            branchId="b1"
            courseType="offline"
          />,
        );
      } else
        act(() =>
          useAuthStore.setState({
            user: {
              ...owner,
              role: 'operator',
              branch_ids: ['b1'],
              permissions: [],
              access_version: 2,
            },
          }),
        );
      expect(
        screen.queryByText('payments.exceeds_debt_title'),
      ).not.toBeInTheDocument();
      fillAmount();
      submit();
      await act(async () => {});
      expect(props.onSubmit).not.toHaveBeenCalled();
    },
  );

  it('does not submit values captured by async form validation before a branch change', async () => {
    const props = { open: true, onClose: vi.fn(), onSubmit: vi.fn() };
    const { rerender } = render(<PaymentModal {...props} branchId="b1" />);
    await selectStudent();
    fillAmount();
    submit();
    rerender(<PaymentModal {...props} branchId="b2" />);
    await act(async () => {});
    expect(props.onSubmit).not.toHaveBeenCalled();
  });

  it('denies a locked student submit after payment access is revoked', async () => {
    render(
      <PaymentModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        lockedStudentId={student.id}
        lockedStudentName="Demo Student"
      />,
    );
    act(() =>
      useAuthStore.setState({
        user: {
          ...owner,
          role: 'operator',
          branch_ids: ['b1'],
          permissions: [],
          access_version: 2,
        },
      }),
    );
    expect(screen.getByRole('button', { name: 'common.add' })).toBeDisabled();
  });

  it('retires a pinned pending confirmation and denies submission after logout', async () => {
    const onSubmit = vi.fn();
    render(
      <PaymentModal
        open
        onClose={vi.fn()}
        onSubmit={onSubmit}
        lockedStudentId={student.id}
        lockedStudentName="Demo Student"
        lockedStudentDebt={1000}
      />,
    );
    fillAmount('1200');
    submit();
    await screen.findByText('payments.exceeds_debt_title');
    act(() => useAuthStore.setState({ user: null, activeBranchId: null }));
    expect(
      screen.queryByText('payments.exceeds_debt_title'),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'common.add' })).toBeDisabled();
    fillAmount();
    submit();
    await act(async () => {});
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not confirm an amount that changed after opening the confirmation', async () => {
    const onSubmit = vi.fn();
    render(<PaymentModal open onClose={vi.fn()} onSubmit={onSubmit} />);
    await selectStudent();
    fillAmount('1200');
    submit();
    await screen.findByText('payments.exceeds_debt_title');
    fillAmount('1500');
    fireEvent.click(
      screen.getByRole('button', { name: 'payments.exceeds_debt_confirm' }),
    );
    await act(async () => {});
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps the amount while a lookup fails, then allows a fresh search result', async () => {
    const onSubmit = vi.fn();
    const props = { open: true, onClose: vi.fn(), onSubmit };
    const { rerender } = render(<PaymentModal {...props} />);
    fillAmount('100');
    fireEvent.click(picker());
    fireEvent.change(screen.getByLabelText('payments.search_placeholder'), {
      target: { value: 'Demo' },
    });
    const result = vi.mocked(useWriteOptions).mock.results.at(-1)!.value;
    vi.mocked(useWriteOptions).mockReturnValue({ ...result, isError: true });
    rerender(<PaymentModal {...props} />);
    await screen.findByText('common.error');
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('0')).toHaveValue('100');
    vi.mocked(useWriteOptions).mockReturnValue({ ...result, isError: false });
    rerender(<PaymentModal {...props} />);
    fireEvent.click(await screen.findByRole('option', { name: /Demo group/ }));
    submit();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      student_id: student.id,
      amount: 100,
    });
  });

  it('allows a create-only operator to select without enabling general student reads', async () => {
    useAuthStore.setState({
      user: {
        ...owner,
        role: 'operator',
        branch_ids: ['b1'],
        permissions: [
          { permission: 'payments.create', scope: 'branch', branch_id: 'b1' },
        ],
      },
    });
    const onSubmit = vi.fn();
    render(<PaymentModal open onClose={vi.fn()} onSubmit={onSubmit} />);
    await selectStudent();
    expect(vi.mocked(useStudentsPage).mock.calls.at(-1)?.[5]).toMatchObject({
      enabled: false,
    });
    fillAmount();
    submit();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
  });

  it('checks the pinned student branch instead of an unrelated active branch grant', () => {
    useAuthStore.setState({
      activeBranchId: 'b2',
      user: {
        ...owner,
        role: 'operator',
        branch_ids: ['b2'],
        permissions: [
          { permission: 'payments.create', scope: 'branch', branch_id: 'b2' },
        ],
      },
    });
    render(
      <PaymentModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        students={[student]}
        lockedStudentId={student.id}
        lockedStudentName="Demo Student"
      />,
    );
    expect(screen.getByRole('button', { name: 'common.add' })).toBeDisabled();
  });
});
