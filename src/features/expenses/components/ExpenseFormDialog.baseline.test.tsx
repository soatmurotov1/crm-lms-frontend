import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axios from '@/api/axiosInstance';
import { ExpenseFormDialog } from './ExpenseFormDialog';
import type { Expense } from '../types';

const validation = vi.hoisted(() => ({
  gate: null as Promise<void> | null,
  ready: vi.fn(),
}));
vi.mock('@hookform/resolvers/zod', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@hookform/resolvers/zod')>();
  return {
    ...actual,
    zodResolver: (...args: Parameters<typeof actual.zodResolver>) => {
      const resolver = actual.zodResolver(...args);
      return async (...values: Parameters<typeof resolver>) => {
        const result = await resolver(...values);
        if (validation.gate) {
          validation.ready();
          await validation.gate;
        }
        return result;
      };
    },
  };
});
vi.mock('@/api/axiosInstance', () => ({ default: { patch: vi.fn() } }));
vi.mock('@/hooks/useCan', () => ({ useCan: () => true }));
vi.mock('@/store/authStore', () => ({
  useAuthStore: (select: (s: unknown) => unknown) =>
    select({ user: { id: 'owner', branch_id: 'branch' } }),
}));
vi.mock('@/hooks/useWriteOptions', () => ({
  useWriteOptions: () => ({ scoped: false }),
}));
vi.mock('../api/expenseService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/expenseService')>()),
  useExpenseTeacherOptions: () => ({ data: [] }),
  useExpenseVehicleOptions: () => ({ data: [] }),
}));

const original: Expense = {
  id: 'expense-1',
  branch_id: null,
  branch_name: null,
  vehicle_id: null,
  vehicle_plate_number: null,
  created_by_id: 'owner',
  category: 'supplies',
  title: 'Original title',
  amount: '100.00',
  expense_date: '2026-09-01',
  due_date: null,
  payee: null,
  note: null,
  paid_amount: '0.00',
  remaining_amount: '100.00',
  status: 'planned',
  reviewed_at: null,
  reviewed_by_id: null,
  version: 1,
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
  has_payment_history: false,
};
const refreshed = {
  ...original,
  title: 'Server title',
  amount: '200.00',
  version: 2,
};
const patch = vi.mocked(axios.patch);
let client: QueryClient;
beforeEach(() => {
  validation.gate = null;
  validation.ready.mockReset();
  client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  patch.mockReset();
  patch.mockRejectedValue({ response: { status: 409 } });
});
afterEach(() => {
  cleanup();
  client.clear();
});
function editor(row = original, onClose = vi.fn(), open = true) {
  return (
    <QueryClientProvider client={client}>
      <ExpenseFormDialog
        open={open}
        branches={[]}
        editExpense={row}
        onClose={onClose}
      />
    </QueryClientProvider>
  );
}
async function submit() {
  fireEvent.click(
    screen.getByRole('button', { name: 'expenses.form.update_submit' }),
  );
  await screen.findByText('expenses.form.update_conflict');
}
describe('expense editor baseline through the real update serializer', () => {
  it('does not dispatch validation completed after the expense session is retired', async () => {
    let release!: () => void;
    validation.gate = new Promise<void>((done) => {
      release = done;
    });
    const view = render(editor());
    fireEvent.submit(
      screen.getByLabelText(/expenses.table.title/).closest('form')!,
    );
    await waitFor(() => expect(validation.ready).toHaveBeenCalled());
    view.rerender(editor({ ...refreshed, id: 'expense-2' }));
    await act(async () => {
      release();
    });
    expect(patch).not.toHaveBeenCalled();
  });
  it('omits financial changes if payment history locks the same ID during validation', async () => {
    let release!: () => void;
    validation.gate = new Promise<void>((done) => {
      release = done;
    });
    const view = render(editor());
    fireEvent.change(screen.getByLabelText(/expenses.form.amount/), {
      target: { value: '150' },
    });
    fireEvent.change(screen.getByLabelText(/expenses.table.title/), {
      target: { value: 'Draft title' },
    });
    fireEvent.submit(
      screen.getByLabelText(/expenses.table.title/).closest('form')!,
    );
    await waitFor(() => expect(validation.ready).toHaveBeenCalled());
    view.rerender(
      editor({ ...refreshed, has_payment_history: true, paid_amount: '10.00' }),
    );
    await act(async () => {
      release();
    });
    await waitFor(() => expect(patch).toHaveBeenCalledOnce());
    expect(patch.mock.calls[0][1]).toMatchObject({
      title: 'Draft title',
      expected_version: 1,
    });
    for (const field of ['amount', 'category', 'expense_date', 'branch_id'])
      expect(patch.mock.calls[0][1]).not.toHaveProperty(field);
  });
  it.each([false, true])(
    'preserves the original values/version after same-ID refresh (dirty=%s)',
    async (dirty) => {
      const view = render(editor());
      if (dirty)
        fireEvent.change(screen.getByLabelText(/expenses.table.title/), {
          target: { value: 'Draft title' },
        });
      view.rerender(editor(refreshed));
      await submit();
      expect(patch).toHaveBeenCalledWith(
        '/expenses/expense-1',
        expect.objectContaining({
          title: dirty ? 'Draft title' : 'Original title',
          amount: '100.00',
          expected_version: 1,
        }),
      );
    },
  );
  it('keeps a conflicted draft and original version on retry while financial locks become live', async () => {
    const view = render(editor());
    fireEvent.change(screen.getByLabelText(/expenses.table.title/), {
      target: { value: 'Draft title' },
    });
    await submit();
    view.rerender(
      editor({ ...refreshed, has_payment_history: true, paid_amount: '10.00' }),
    );
    expect(
      screen.getByText('expenses.form.update_conflict'),
    ).toBeInTheDocument();
    await submit();
    expect(patch).toHaveBeenCalledTimes(2);
    const body = patch.mock.calls[1][1];
    expect(body).toMatchObject({ title: 'Draft title', expected_version: 1 });
    expect(body).not.toHaveProperty('amount');
    expect(body).not.toHaveProperty('category');
    expect(body).not.toHaveProperty('expense_date');
  });
  it('takes fresh values/version after close/reopen and ID change', async () => {
    const view = render(editor());
    await submit();
    view.rerender(editor(refreshed, vi.fn(), false));
    view.rerender(editor(refreshed));
    expect(screen.queryByText('expenses.form.update_conflict')).toBeNull();
    await submit();
    expect(patch.mock.calls[1]).toEqual([
      '/expenses/expense-1',
      expect.objectContaining({ title: 'Server title', expected_version: 2 }),
    ]);
    view.rerender(
      editor({
        ...refreshed,
        id: 'expense-2',
        title: 'Second record',
        version: 7,
      }),
    );
    await submit();
    expect(patch.mock.calls[2]).toEqual([
      '/expenses/expense-2',
      expect.objectContaining({ title: 'Second record', expected_version: 7 }),
    ]);
  });
  it('blocks repeated submit/discard while pending and ignores late success after an ID switch', async () => {
    let resolve!: (value: unknown) => void;
    patch.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const close = vi.fn();
    const view = render(editor(original, close));
    const form = screen.getByLabelText(/expenses.table.title/).closest('form')!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }));
    const discard = screen.queryByRole('button', { name: 'common.discard' });
    if (discard) fireEvent.click(discard);
    expect(close).not.toHaveBeenCalled();
    view.rerender(editor({ ...refreshed, id: 'expense-2' }, close));
    await act(async () => {
      resolve({ data: { data: original } });
    });
    expect(close).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue('Server title')).toBeInTheDocument();
  });
});
