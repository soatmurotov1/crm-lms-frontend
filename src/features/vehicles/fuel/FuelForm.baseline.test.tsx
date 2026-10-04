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
import FuelForm from './FuelForm';
import FuelDetailPage from './FuelDetailPage';
import type { Fuel } from './service';

const state = vi.hoisted(() => ({
  row: undefined as Fuel | undefined,
  allowed: true,
  userId: 'author',
  navigate: vi.fn(),
  refetch: vi.fn(),
}));
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
vi.mock('@/api/axiosInstance', () => ({
  default: { patch: vi.fn(), get: vi.fn(), post: vi.fn() },
}));
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => state.navigate,
  useParams: () => ({ id: state.row?.id }),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));
vi.mock('@/hooks/useCan', () => ({ useCan: () => state.allowed }));
vi.mock('@/store/authStore', () => ({
  useAuthStore: (select: (s: unknown) => unknown) =>
    select({ user: { id: state.userId } }),
}));
vi.mock('./service', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./service')>()),
  useFuelVehicles: () => ({ data: undefined }),
  useStations: () => ({ data: undefined }),
  useFuel: () => ({
    data: state.row,
    isLoading: false,
    refetch: state.refetch,
  }),
}));
const original: Fuel = {
  id: 'fuel-1',
  author_id: 'author',
  status: 'draft',
  source_status: 'manual_review',
  vehicle_id: 'vehicle-1',
  vehicle_plate: 'SYNTHETIC',
  station_id: 'station-1',
  station_name: 'Synthetic Station',
  occurred_at: '2026-09-01T10:00:00Z',
  odometer_km: 100,
  funding_source: 'partner_credit',
  qr_url: '',
  expense_id: null,
  author_name: 'Synthetic Author',
  request_id: 'request-1',
  version: 1,
  lines: [
    {
      fuel_type: 'petrol',
      unit: 'litre',
      quantity: '2',
      unit_price: '100.00',
      line_total: '200.00',
      name: 'Original line',
    },
  ],
  evidence: [],
  history: [],
};
const refreshed = {
  ...original,
  odometer_km: 200,
  version: 2,
  request_id: 'server-request-2',
};
const patch = vi.mocked(axios.patch);
let client: QueryClient;
beforeEach(() => {
  validation.gate = null;
  validation.ready.mockReset();
  client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  patch.mockReset().mockRejectedValue({ response: { status: 409 } });
  state.allowed = true;
  state.userId = 'author';
  state.row = original;
  state.navigate.mockReset();
  state.refetch.mockReset();
});
afterEach(() => {
  cleanup();
  client.clear();
});
const editor = (row = original) => (
  <QueryClientProvider client={client}>
    <FuelForm row={row} />
  </QueryClientProvider>
);
const page = () => (
  <QueryClientProvider client={client}>
    <FuelDetailPage />
  </QueryClientProvider>
);
function fillReason() {
  fireEvent.change(screen.getByLabelText('fuel.reason'), {
    target: { value: 'Original correction reason' },
  });
}
async function submit(count = 1) {
  fireEvent.click(screen.getByRole('button', { name: 'common.save' }));
  await waitFor(() => expect(patch).toHaveBeenCalledTimes(count));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'common.save' })).toBeEnabled(),
  );
}
describe('fuel editor baseline through real saveFuel/useFuelMutation', () => {
  it.each(['id', 'grant', 'author', 'status', 'pending'])(
    'does not dispatch delayed validation after %s retires the fuel session',
    async (retirement) => {
      let release!: () => void;
      validation.gate = new Promise<void>((done) => {
        release = done;
      });
      const view = render(
        ['id', 'pending'].includes(retirement) ? editor() : page(),
      );
      const form = screen.getByLabelText('fuel.odometer_km').closest('form')!;
      fireEvent.change(form.querySelector('input[required]')!, {
        target: { value: 'Correction reason' },
      });
      fireEvent.submit(form);
      await waitFor(() => expect(validation.ready).toHaveBeenCalled());
      if (retirement === 'pending')
        view.rerender(
          <QueryClientProvider client={client}>
            <FuelForm row={original} disabled />
          </QueryClientProvider>,
        );
      else if (retirement === 'id')
        view.rerender(editor({ ...refreshed, id: 'fuel-2' }));
      else {
        if (retirement === 'grant') state.allowed = false;
        if (retirement === 'author')
          state.row = { ...original, author_id: 'other' };
        if (retirement === 'status')
          state.row = { ...original, status: 'submitted' };
        view.rerender(page());
      }
      await act(async () => {
        release();
      });
      expect(patch).not.toHaveBeenCalled();
    },
  );
  it('blocks lifecycle actions while the correction is pending', async () => {
    patch.mockImplementation(() => new Promise(() => {}));
    state.row = {
      ...original,
      evidence: [
        { id: 'receipt', slot: 'receipt' },
        { id: 'odometer', slot: 'odometer' },
      ],
    };
    const view = render(page());
    const form = screen.getByLabelText('fuel.odometer_km').closest('form')!;
    fireEvent.change(form.querySelector('input[required]')!, {
      target: { value: 'Correction reason' },
    });
    fireEvent.change(screen.getAllByLabelText('fuel.reason')[1], {
      target: { value: 'Lifecycle reason' },
    });
    fireEvent.submit(form);
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: 'fuel.submit' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'fuel.cancel' })).toBeDisabled();
    view.unmount();
  });
  it('advances only an acknowledged save version while retaining input typed during the request', async () => {
    let resolve!: (value: unknown) => void;
    patch.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const view = render(editor());
    fillReason();
    fireEvent.change(screen.getByLabelText('fuel.odometer_km'), {
      target: { value: '150' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'common.save' }));
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(patch.mock.calls[0][1]).toMatchObject({
      expected_version: 1,
      odometer_km: 150,
    });
    fireEvent.change(screen.getByLabelText('fuel.odometer_km'), {
      target: { value: '175' },
    });
    await act(async () => {
      resolve({
        data: { data: { ...original, version: 2, odometer_km: 150 } },
      });
    });
    await waitFor(() => expect(state.navigate).toHaveBeenCalledOnce());
    view.rerender(editor({ ...refreshed, odometer_km: 150 }));
    expect(screen.getByLabelText('fuel.odometer_km')).toHaveValue('175');
    expect(screen.getByLabelText('fuel.reason')).toHaveValue(
      'Original correction reason',
    );
    await submit(2);
    expect(patch.mock.calls[1]).toEqual([
      '/vehicle-fuel/fuel-1',
      expect.objectContaining({
        expected_version: 2,
        odometer_km: 175,
        request_id: 'request-1',
        reason: 'Original correction reason',
      }),
    ]);
  });
  it.each([false, true])(
    'keeps baseline values/version/request after same-ID refresh (dirty=%s)',
    async (dirty) => {
      const view = render(editor());
      fillReason();
      if (dirty)
        fireEvent.change(screen.getByLabelText('fuel.odometer_km'), {
          target: { value: '150' },
        });
      view.rerender(editor(refreshed));
      await submit();
      expect(patch).toHaveBeenCalledWith(
        '/vehicle-fuel/fuel-1',
        expect.objectContaining({
          odometer_km: dirty ? 150 : 100,
          expected_version: 1,
          request_id: 'request-1',
          reason: 'Original correction reason',
        }),
      );
    },
  );
  it('retains conflict feedback, reason, draft and original version/request on retry without refetch', async () => {
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const view = render(editor());
    fillReason();
    fireEvent.change(screen.getByLabelText('fuel.odometer_km'), {
      target: { value: '150' },
    });
    await submit();
    expect(await screen.findByText('fuel.update_conflict')).toBeInTheDocument();
    view.rerender(editor(refreshed));
    await submit(2);
    expect(patch.mock.calls[1][1]).toMatchObject({
      odometer_km: 150,
      expected_version: 1,
      request_id: 'request-1',
      reason: 'Original correction reason',
    });
    expect(invalidate).not.toHaveBeenCalled();
    expect(state.refetch).not.toHaveBeenCalled();
  });
  it('initializes a new ID and remount with their own values/version/request and clears reason/conflict', async () => {
    const view = render(editor());
    fillReason();
    await submit();
    const second = {
      ...refreshed,
      id: 'fuel-2',
      request_id: 'request-2',
      version: 7,
    };
    view.rerender(editor(second));
    expect(screen.getByLabelText('fuel.odometer_km')).toHaveValue('200');
    expect(screen.getByLabelText('fuel.reason')).toHaveValue('');
    expect(screen.queryByText('fuel.update_conflict')).toBeNull();
    fillReason();
    await submit(2);
    expect(patch.mock.calls[1]).toEqual([
      '/vehicle-fuel/fuel-2',
      expect.objectContaining({
        expected_version: 7,
        request_id: 'request-2',
        odometer_km: 200,
      }),
    ]);
    view.unmount();
    render(editor(refreshed));
    fillReason();
    await submit(3);
    expect(patch.mock.calls[2][1]).toMatchObject({
      expected_version: 2,
      request_id: 'server-request-2',
      odometer_km: 200,
    });
  });
  it('prevents duplicate submit and ignores late save navigation after an ID switch', async () => {
    let resolve!: (value: unknown) => void;
    patch.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const view = render(editor());
    fillReason();
    const form = screen.getByLabelText('fuel.odometer_km').closest('form')!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    view.rerender(editor({ ...refreshed, id: 'fuel-2' }));
    await act(async () => {
      resolve({ data: { data: { ...original, version: 99 } } });
    });
    expect(state.navigate).not.toHaveBeenCalled();
    expect(screen.getByLabelText('fuel.odometer_km')).toHaveValue('200');
    fillReason();
    await submit(2);
    expect(patch.mock.calls[1]).toEqual([
      '/vehicle-fuel/fuel-2',
      expect.objectContaining({
        expected_version: 2,
        request_id: 'server-request-2',
      }),
    ]);
  });
  it.each(['grant', 'author', 'status'])(
    'removes the actual editor when live %s eligibility is lost',
    (guard) => {
      const view = render(page());
      expect(
        screen.getByRole('button', { name: 'common.save' }),
      ).toBeInTheDocument();
      if (guard === 'grant') state.allowed = false;
      if (guard === 'author') state.row = { ...original, author_id: 'other' };
      if (guard === 'status') state.row = { ...original, status: 'submitted' };
      view.rerender(page());
      expect(screen.queryByRole('button', { name: 'common.save' })).toBeNull();
    },
  );
});
