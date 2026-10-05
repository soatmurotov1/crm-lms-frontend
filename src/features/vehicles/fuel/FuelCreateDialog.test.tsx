import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FuelCreateDialog from './FuelCreateDialog';
import uz from '@/i18n/locales/uz.json';
import ru from '@/i18n/locales/ru.json';
import en from '@/i18n/locales/en.json';

const { lookupState, authState, vehiclesState } = vi.hoisted(() => ({
  lookupState: {
    shouldFail: false,
    rateLimited: false,
    serverErrorMessage: '',
    manualReview: false,
    decodeFails: false,
  },
  authState: { user: null as { id: string; role: string } | null },
  vehiclesState: {
    data: [
      {
        id: 'v-1',
        plate_number: '01A777AA',
        model: 'Lacetti',
        fuel_types: ['petrol'],
        current_custodian_id: 'u-9' as string | null,
      },
    ],
  },
}));

vi.mock('@/store/authStore', () => ({
  useAuthStore: (selector: (s: { user: unknown }) => unknown) =>
    selector({ user: authState.user }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (options?.current) return `${key}:${options.current}`;
      return key;
    },
  }),
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useQueryClient: () => ({
    invalidateQueries: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('./policy', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./policy')>();
  return {
    ...actual,
    decodeReceipt: vi.fn().mockImplementation(async () => {
      if (lookupState.decodeFails) return null;
      return 'https://ofd.soliq.uz/check?t=A&r=1&c=20260924101705&s=123456789012';
    }),
  };
});

const submitFuelComplete = vi.fn().mockResolvedValue({ id: 'saved-id' });
const saveFuel = vi.fn().mockResolvedValue({ id: 'draft-id' });

vi.mock('./service', () => {
  return {
    useFuelVehicles: vi
      .fn()
      .mockImplementation(() => ({ data: vehiclesState })),
    useStations: vi.fn().mockReturnValue({
      data: {
        data: [
          {
            id: 's-1',
            name: 'QK MCHJ TATNEFT-UNG',
            stir: '306721371',
          },
        ],
      },
    }),
    useVehicleLastFuel: vi.fn().mockReturnValue({
      data: { odometer_km: 50000 },
    }),
    lookupReceipt: vi.fn().mockImplementation(async () => {
      if (lookupState.shouldFail) {
        throw new Error('500 internal server error');
      }
      if (lookupState.rateLimited) {
        const err = Object.assign(new Error('Too many requests'), {
          response: { status: 429 },
        });
        throw err;
      }
      if (lookupState.serverErrorMessage) {
        const err = Object.assign(new Error('Backend failed'), {
          response: {
            status: 422,
            data: {
              error: {
                code: 'RECEIPT_MISMATCH',
                message: lookupState.serverErrorMessage,
              },
            },
          },
        });
        throw err;
      }
      return {
        status: lookupState.manualReview ? 'manual_review' : 'source_verified',
        seller_name: 'QK MCHJ TATNEFT-UNG',
        seller_tin: '306721371',
        total: '1100100.00',
        lines: [
          {
            index: 0,
            name: 'TPK-4 AI-95-K5 TAHEKO',
            mxik: '02710001007000000',
            quantity: '56.42',
            unit_price: '19500.00',
            line_total: '1100100.00',
          },
        ],
      };
    }),
    submitFuelComplete: (...args: unknown[]) => submitFuelComplete(...args),
    saveFuel: (...args: unknown[]) => saveFuel(...args),
  };
});

describe('FuelCreateDialog component', () => {
  beforeEach(() => {
    lookupState.shouldFail = false;
    lookupState.rateLimited = false;
    lookupState.serverErrorMessage = '';
    lookupState.manualReview = false;
    lookupState.decodeFails = false;
    submitFuelComplete.mockClear();
    saveFuel.mockClear();
    authState.user = null;
    vehiclesState.data = [
      {
        id: 'v-1',
        plate_number: '01A777AA',
        model: 'Lacetti',
        fuel_types: ['petrol'],
        current_custodian_id: 'u-9',
      },
    ];
  });

  const goToStep2 = () => {
    // In Step 1, auto-selected vehicle allows clicking continue
    const continueBtn = screen.getByRole('button', {
      name: /common.continue/i,
    });
    fireEvent.click(continueBtn);
  };

  it('preserves a selected vehicle when discard is cancelled and resets only after confirmation', async () => {
    vehiclesState.data.push({
      id: 'v-2',
      plate_number: '01B111BB',
      model: 'Nexia',
      fuel_types: ['petrol'],
      current_custodian_id: null,
    });
    const onOpenChange = vi.fn();
    render(<FuelCreateDialog open={true} onOpenChange={onOpenChange} />);
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'v-2' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }));

    expect(onOpenChange).not.toHaveBeenCalled();
    const confirmation = screen.getByRole('dialog', {
      name: 'common.discard_changes_title',
    });
    fireEvent.click(
      within(confirmation).getByRole('button', { name: 'common.cancel' }),
    );
    await waitFor(() =>
      expect(
        screen.queryByText('common.discard_changes_title'),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('combobox')).toHaveValue('v-2');

    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }));
    fireEvent.click(screen.getByRole('button', { name: 'common.discard' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole('combobox')).toHaveValue('');
  });

  it('closes a pristine pre-bound vehicle without asking to discard', () => {
    const onOpenChange = vi.fn();
    render(
      <FuelCreateDialog
        open={true}
        initialVehicleId="v-1"
        onOpenChange={onOpenChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(
      screen.queryByText('common.discard_changes_title'),
    ).not.toBeInTheDocument();
  });

  it('preserves durable draft fields after backtracking and replacing a receipt with an oversized file', async () => {
    const onOpenChange = vi.fn();
    render(
      <FuelCreateDialog
        open={true}
        initialVehicleId="v-1"
        onOpenChange={onOpenChange}
      />,
    );
    goToStep2();
    const receipt = new File(['receipt'], 'receipt.jpg', {
      type: 'image/jpeg',
    });
    fireEvent.change(screen.getByLabelText('fuel.scan_receipt_btn'), {
      target: { files: [receipt] },
    });
    await screen.findByText('QK MCHJ TATNEFT-UNG');
    fireEvent.click(screen.getByRole('button', { name: 'common.continue' }));
    fireEvent.change(screen.getByLabelText(/fuel.funding_source/), {
      target: { value: 'personal' },
    });
    fireEvent.change(screen.getByLabelText(/fuel.quantity/), {
      target: { value: '60' },
    });
    fireEvent.change(screen.getByLabelText(/fuel.date/), {
      target: { value: '2026-09-24T10:30' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'common.continue' }));
    fireEvent.change(screen.getByLabelText(/fuel.odometer_km/), {
      target: { value: '50250' },
    });
    const odometerPhoto = new File(['odometer'], 'odo.jpg', {
      type: 'image/jpeg',
    });
    fireEvent.change(screen.getByLabelText(/fuel.odometer_photo_label/), {
      target: { files: [odometerPhoto] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'common.back' }));
    fireEvent.click(screen.getByRole('button', { name: 'common.back' }));
    const oversizedReceipt = new File(
      [new Uint8Array(8 * 1024 * 1024 + 1)],
      'large.jpg',
      {
        type: 'image/jpeg',
      },
    );
    fireEvent.change(screen.getByLabelText('fuel.scan_receipt_btn'), {
      target: { files: [oversizedReceipt] },
    });
    expect(screen.getByText('fuel.qr_too_large')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'common.back' }));
    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }));

    expect(onOpenChange).not.toHaveBeenCalled();
    const confirmation = screen.getByRole('dialog', {
      name: 'common.discard_changes_title',
    });
    fireEvent.click(
      within(confirmation).getByRole('button', { name: 'common.cancel' }),
    );
    await waitFor(() =>
      expect(
        screen.queryByText('common.discard_changes_title'),
      ).not.toBeInTheDocument(),
    );
    goToStep2();
    lookupState.decodeFails = true;
    fireEvent.change(screen.getByLabelText('fuel.scan_receipt_btn'), {
      target: { files: [receipt] },
    });
    await screen.findByText('fuel.qr_fallback');
    fireEvent.click(screen.getByRole('button', { name: 'common.continue' }));

    expect(screen.getByLabelText(/fuel.station/)).toHaveValue('s-1');
    expect(screen.getByLabelText(/fuel.funding_source/)).toHaveValue(
      'personal',
    );
    expect(screen.getByLabelText(/fuel.quantity/)).toHaveValue(60);
    expect(screen.getByLabelText(/fuel.date/)).toHaveValue('2026-09-24T10:30');
    fireEvent.click(screen.getByRole('button', { name: 'common.continue' }));
    expect(screen.getByLabelText(/fuel.odometer_km/)).toHaveValue(50250);
    expect(screen.getByRole('button', { name: 'odo.jpg' })).toBeInTheDocument();
  });

  it('pre-binds the vehicle passed via initialVehicleId', () => {
    vehiclesState.data = [
      {
        id: 'v-1',
        plate_number: '01A777AA',
        model: 'Lacetti',
        fuel_types: ['petrol'],
        current_custodian_id: 'u-9',
      },
      {
        id: 'v-2',
        plate_number: '01B111BB',
        model: 'Nexia',
        fuel_types: ['petrol'],
        current_custodian_id: null,
      },
    ];
    render(
      <FuelCreateDialog
        open={true}
        onOpenChange={vi.fn()}
        initialVehicleId="v-2"
      />,
    );

    expect(screen.getByRole('combobox')).toHaveValue('v-2');
  });

  it('auto-selects the teacher own custodian vehicle when several vehicles exist', () => {
    authState.user = { id: 'u-9', role: 'teacher' };
    vehiclesState.data = [
      {
        id: 'v-1',
        plate_number: '01A777AA',
        model: 'Lacetti',
        fuel_types: ['petrol'],
        current_custodian_id: 'u-9',
      },
      {
        id: 'v-2',
        plate_number: '01B111BB',
        model: 'Nexia',
        fuel_types: ['petrol'],
        current_custodian_id: 'u-4',
      },
    ];
    render(<FuelCreateDialog open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByRole('combobox')).toHaveValue('v-1');
  });

  it('leaves the vehicle unselected when a teacher owns none of them', () => {
    authState.user = { id: 'u-4', role: 'teacher' };
    vehiclesState.data = [
      {
        id: 'v-1',
        plate_number: '01A777AA',
        model: 'Lacetti',
        fuel_types: ['petrol'],
        current_custodian_id: 'u-9',
      },
      {
        id: 'v-2',
        plate_number: '01B111BB',
        model: 'Nexia',
        fuel_types: ['petrol'],
        current_custodian_id: 'u-8',
      },
    ];
    render(<FuelCreateDialog open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByRole('combobox')).toHaveValue('');
  });

  it('renders Step 1 (Vehicle selection) with auto-selected vehicle and progress bar', () => {
    render(<FuelCreateDialog open={true} onOpenChange={vi.fn()} />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'fuel.step_vehicle' }),
    ).toBeInTheDocument();
    expect(screen.getByText('fuel.select_vehicle_prompt')).toBeInTheDocument();
    expect(screen.getAllByText(/01A777AA/).length).toBeGreaterThan(0);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('scans receipt file, runs lookup and shows Soliq verified station in Step 2', async () => {
    render(<FuelCreateDialog open={true} onOpenChange={vi.fn()} />);
    goToStep2();

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'fuel.step_receipt_upload',
      }),
    ).toBeInTheDocument();
    const receiptInput = screen.getByLabelText('fuel.scan_receipt_btn');
    const fakeFile = new File(['fake image content'], 'receipt.jpg', {
      type: 'image/jpeg',
    });

    fireEvent.change(receiptInput, { target: { files: [fakeFile] } });

    await waitFor(() => {
      expect(screen.getByText('QK MCHJ TATNEFT-UNG')).toBeInTheDocument();
    });

    expect(screen.getByText('STIR: 306721371')).toBeInTheDocument();
  });

  it('distinguishes a Soliq lookup failure from an unreadable QR in Step 2', async () => {
    lookupState.shouldFail = true;
    render(<FuelCreateDialog open={true} onOpenChange={vi.fn()} />);
    goToStep2();

    const fakeFile = new File(['fake image content'], 'receipt.jpg', {
      type: 'image/jpeg',
    });

    fireEvent.change(screen.getByLabelText('fuel.scan_receipt_btn'), {
      target: { files: [fakeFile] },
    });

    await waitFor(() => {
      expect(screen.getByText('fuel.qr_lookup_error')).toBeInTheDocument();
    });
    expect(screen.queryByText('fuel.qr_fallback')).not.toBeInTheDocument();
  });

  it('shows a rate-limit message instead of blaming the QR when throttled', async () => {
    lookupState.rateLimited = true;
    render(<FuelCreateDialog open={true} onOpenChange={vi.fn()} />);
    goToStep2();

    const fakeFile = new File(['fake image content'], 'receipt.jpg', {
      type: 'image/jpeg',
    });

    fireEvent.change(screen.getByLabelText('fuel.scan_receipt_btn'), {
      target: { files: [fakeFile] },
    });

    expect(await screen.findByText('fuel.qr_rate_limited')).toBeInTheDocument();
    expect(screen.queryByText('fuel.qr_lookup_error')).not.toBeInTheDocument();
  });

  it('surfaces the real backend error instead of the generic QR message', async () => {
    lookupState.serverErrorMessage =
      'Fiscal receipt time differs from refueling date';
    render(<FuelCreateDialog open={true} onOpenChange={vi.fn()} />);
    goToStep2();

    const fakeFile = new File(['fake image content'], 'receipt.jpg', {
      type: 'image/jpeg',
    });

    fireEvent.change(screen.getByLabelText('fuel.scan_receipt_btn'), {
      target: { files: [fakeFile] },
    });

    expect(
      await screen.findByText(
        'Fiscal receipt time differs from refueling date',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('fuel.qr_lookup_error')).not.toBeInTheDocument();
  });

  it('keeps manual QR recovery available when image decoding fails', async () => {
    lookupState.decodeFails = true;
    render(<FuelCreateDialog open={true} onOpenChange={vi.fn()} />);
    goToStep2();

    const fakeFile = new File(['fake image content'], 'receipt.jpg', {
      type: 'image/jpeg',
    });

    fireEvent.change(screen.getByLabelText('fuel.scan_receipt_btn'), {
      target: { files: [fakeFile] },
    });

    expect(await screen.findByText('fuel.qr_fallback')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'fuel.qr_url' }));
    expect(screen.getByLabelText('fuel.qr_url')).toBeInTheDocument();
  });

  it('looks up a manually entered fiscal QR URL', async () => {
    lookupState.decodeFails = true;
    render(<FuelCreateDialog open={true} onOpenChange={vi.fn()} />);
    goToStep2();

    const fakeFile = new File(['fake image content'], 'receipt.jpg', {
      type: 'image/jpeg',
    });

    fireEvent.change(screen.getByLabelText('fuel.scan_receipt_btn'), {
      target: { files: [fakeFile] },
    });

    fireEvent.click(await screen.findByRole('button', { name: 'fuel.qr_url' }));
    const qrInput = screen.getByLabelText('fuel.qr_url');
    fireEvent.change(qrInput, {
      target: {
        value:
          'https://ofd.soliq.uz/check?t=A&r=1&c=20260924101705&s=123456789012',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'fuel.lookup' }));

    expect(await screen.findByText('QK MCHJ TATNEFT-UNG')).toBeInTheDocument();
  });

  it('explains when the receipt image exceeds the size limit', async () => {
    render(<FuelCreateDialog open={true} onOpenChange={vi.fn()} />);
    goToStep2();

    const oversizedFile = new File(
      [new Uint8Array(8 * 1024 * 1024 + 1)],
      'large-receipt.jpg',
      { type: 'image/jpeg' },
    );

    fireEvent.change(screen.getByLabelText('fuel.scan_receipt_btn'), {
      target: { files: [oversizedFile] },
    });

    expect(await screen.findByText('fuel.qr_too_large')).toBeInTheDocument();
  });

  it('completes the full 5-step flow from vehicle to review and submits', async () => {
    const onOpenChange = vi.fn();
    render(<FuelCreateDialog open={true} onOpenChange={onOpenChange} />);

    // Step 1: Vehicle selection
    expect(
      screen.getByRole('heading', { level: 2, name: 'fuel.step_vehicle' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /common.continue/i }));

    // Step 2: Receipt upload
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'fuel.step_receipt_upload',
      }),
    ).toBeInTheDocument();
    const fakeFile = new File(['fake image content'], 'receipt.jpg', {
      type: 'image/jpeg',
    });
    fireEvent.change(screen.getByLabelText('fuel.scan_receipt_btn'), {
      target: { files: [fakeFile] },
    });

    await waitFor(() => {
      expect(screen.getByText('QK MCHJ TATNEFT-UNG')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /common.continue/i }));

    // Step 3: Receipt details & lines
    expect(
      await screen.findByRole('heading', {
        level: 2,
        name: 'fuel.step_receipt_details',
      }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /common.continue/i }));

    // Step 4: Odometer
    expect(
      await screen.findByRole('heading', {
        level: 2,
        name: 'fuel.step_odometer',
      }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/fuel.odometer_km/i), {
      target: { value: '50250' },
    });
    const odoFile = new File(['odometer file content'], 'odo.jpg', {
      type: 'image/jpeg',
    });
    fireEvent.change(screen.getByLabelText(/fuel.odometer_photo_label/i), {
      target: { files: [odoFile] },
    });
    fireEvent.click(screen.getByRole('button', { name: /common.continue/i }));

    // Step 5: Full review
    expect(
      await screen.findByRole('heading', {
        level: 2,
        name: 'fuel.step_review',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'fuel.submit_for_review' }),
    ).toBeEnabled();
    expect(
      screen.getByRole('button', { name: 'fuel.submit_for_review' }),
    ).not.toHaveAttribute('aria-disabled');
    expect(
      document.getElementById('fuel-submit-evidence-hint'),
    ).not.toBeInTheDocument();

    // Submit
    fireEvent.click(
      screen.getByRole('button', { name: 'fuel.submit_for_review' }),
    );

    await waitFor(() => {
      expect(submitFuelComplete).toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
    // One complete pipeline call carrying both evidence files.
    expect(submitFuelComplete).toHaveBeenCalledTimes(1);
    expect(submitFuelComplete.mock.calls[0][0]).toMatchObject({
      receiptFile: fakeFile,
      odometerFile: odoFile,
    });
    expect(saveFuel).not.toHaveBeenCalled();
  });
});

// #348-A: the backend rejects submit unless both the receipt and odometer
// evidence slots exist, so the final path must be preflighted in the UI.
describe('FuelCreateDialog evidence preflight (#348-A)', () => {
  beforeEach(() => {
    lookupState.shouldFail = false;
    lookupState.rateLimited = false;
    lookupState.serverErrorMessage = '';
    lookupState.manualReview = false;
    lookupState.decodeFails = false;
    submitFuelComplete.mockClear();
    saveFuel.mockClear();
    authState.user = null;
    vehiclesState.data = [
      {
        id: 'v-1',
        plate_number: '01A777AA',
        model: 'Lacetti',
        fuel_types: ['petrol'],
        current_custodian_id: 'u-9',
      },
    ];
  });

  const syntheticReceipt = () =>
    new File(['synthetic receipt'], 'receipt.jpg', { type: 'image/jpeg' });
  const syntheticOdometer = () =>
    new File(['synthetic odometer'], 'odo.jpg', { type: 'image/jpeg' });
  const clickContinue = () =>
    fireEvent.click(screen.getByRole('button', { name: 'common.continue' }));
  const submitButton = () =>
    screen.getByRole('button', { name: 'fuel.submit_for_review' });
  const evidenceHint = () =>
    document.getElementById('fuel-submit-evidence-hint');

  // Steps 3 -> 4, entering a valid odometer reading.
  const fromReceiptToOdometer = async () => {
    clickContinue();
    await screen.findByRole('heading', {
      level: 2,
      name: 'fuel.step_receipt_details',
    });
    clickContinue();
    await screen.findByRole('heading', {
      level: 2,
      name: 'fuel.step_odometer',
    });
    fireEvent.change(screen.getByLabelText(/fuel.odometer_km/), {
      target: { value: '50250' },
    });
  };

  const reachOdometerStepWithReceipt = async (receipt = syntheticReceipt()) => {
    fireEvent.click(screen.getByRole('button', { name: 'common.continue' }));
    fireEvent.change(screen.getByLabelText('fuel.scan_receipt_btn'), {
      target: { files: [receipt] },
    });
    await screen.findByText('QK MCHJ TATNEFT-UNG');
    await fromReceiptToOdometer();
  };

  const attachOdometer = (file = syntheticOdometer()) =>
    fireEvent.change(screen.getByLabelText(/fuel.odometer_photo_label/), {
      target: { files: [file] },
    });

  const continueToReview = async () => {
    clickContinue();
    await screen.findByRole('heading', { level: 2, name: 'fuel.step_review' });
  };

  it('AC-01/AC-02: shows "attached" only once an odometer photo is selected', async () => {
    render(<FuelCreateDialog open={true} onOpenChange={vi.fn()} />);
    await reachOdometerStepWithReceipt();

    expect(
      screen.queryByText('fuel.odometer_attached'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('fuel.odometer_required_for_submit'),
    ).toBeInTheDocument();

    attachOdometer();

    expect(screen.getByText('fuel.odometer_attached')).toBeInTheDocument();
    expect(
      screen.queryByText('fuel.odometer_required_for_submit'),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'odo.jpg' })).toBeInTheDocument();
  });

  it('AC-04: blocks submit without an odometer photo, explains why and sends nothing', async () => {
    render(<FuelCreateDialog open={true} onOpenChange={vi.fn()} />);
    await reachOdometerStepWithReceipt();
    await continueToReview();

    const button = submitButton();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    // Still keyboard reachable, and the reason is announced with it.
    button.focus();
    expect(button).toHaveFocus();
    expect(button).toHaveAccessibleDescription(
      /fuel\.no_odometer_image.*fuel\.submit_evidence_required/,
    );
    const hint = evidenceHint();
    expect(hint).toBeInTheDocument();
    expect(
      within(hint as HTMLElement).getByText('fuel.no_odometer_image'),
    ).toBeInTheDocument();
    expect(
      within(hint as HTMLElement).queryByText('fuel.no_receipt_image'),
    ).not.toBeInTheDocument();

    // A forced activation still creates, uploads and submits nothing.
    fireEvent.click(button);
    fireEvent.keyDown(button, { key: 'Enter' });
    await Promise.resolve();
    expect(submitFuelComplete).not.toHaveBeenCalled();
    expect(saveFuel).not.toHaveBeenCalled();
  });

  it('AC-03: blocks submit when the receipt came only from a manual QR lookup', async () => {
    lookupState.decodeFails = true;
    render(<FuelCreateDialog open={true} onOpenChange={vi.fn()} />);
    clickContinue();

    // Open manual QR entry, then replace the receipt with an oversized file,
    // which clears the selected receipt image.
    fireEvent.change(screen.getByLabelText('fuel.scan_receipt_btn'), {
      target: { files: [syntheticReceipt()] },
    });
    fireEvent.click(await screen.findByRole('button', { name: 'fuel.qr_url' }));
    fireEvent.change(screen.getByLabelText('fuel.scan_receipt_btn'), {
      target: {
        files: [
          new File([new Uint8Array(8 * 1024 * 1024 + 1)], 'large.jpg', {
            type: 'image/jpeg',
          }),
        ],
      },
    });
    expect(screen.getByText('fuel.qr_too_large')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('fuel.qr_url'), {
      target: {
        value:
          'https://ofd.soliq.uz/check?t=A&r=1&c=20261001120000&s=123456789012',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'fuel.lookup' }));
    await screen.findByText('QK MCHJ TATNEFT-UNG');

    await fromReceiptToOdometer();
    attachOdometer();
    await continueToReview();

    const button = submitButton();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    const hint = evidenceHint() as HTMLElement;
    expect(within(hint).getByText('fuel.no_receipt_image')).toBeInTheDocument();
    expect(
      within(hint).queryByText('fuel.no_odometer_image'),
    ).not.toBeInTheDocument();

    fireEvent.click(button);
    await Promise.resolve();
    expect(submitFuelComplete).not.toHaveBeenCalled();
    expect(saveFuel).not.toHaveBeenCalled();
  });

  it('AC-06: still saves a draft when evidence is missing', async () => {
    const onOpenChange = vi.fn();
    render(<FuelCreateDialog open={true} onOpenChange={onOpenChange} />);
    await reachOdometerStepWithReceipt();
    await continueToReview();

    const saveDraft = screen.getByRole('button', { name: 'fuel.save_draft' });
    expect(saveDraft).toBeEnabled();
    fireEvent.click(saveDraft);

    await waitFor(() => expect(saveFuel).toHaveBeenCalledTimes(1));
    expect(saveFuel.mock.calls[0][0]).toMatchObject({
      vehicle_id: 'v-1',
      station_id: 's-1',
      odometer_km: '50250',
    });
    expect(submitFuelComplete).not.toHaveBeenCalled();
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('AC-08: keeps both files and values after a failed submit and retries once more', async () => {
    submitFuelComplete.mockRejectedValueOnce(new Error('upload failed'));
    const onOpenChange = vi.fn();
    const receipt = syntheticReceipt();
    const odometer = syntheticOdometer();
    render(<FuelCreateDialog open={true} onOpenChange={onOpenChange} />);
    await reachOdometerStepWithReceipt(receipt);
    attachOdometer(odometer);
    await continueToReview();

    fireEvent.click(submitButton());
    await waitFor(() => expect(submitFuelComplete).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(submitButton()).toBeEnabled());

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(submitButton()).not.toHaveAttribute('aria-disabled');
    expect(evidenceHint()).not.toBeInTheDocument();

    fireEvent.click(submitButton());
    await waitFor(() => expect(submitFuelComplete).toHaveBeenCalledTimes(2));
    expect(submitFuelComplete.mock.calls[1][0]).toMatchObject({
      receiptFile: receipt,
      odometerFile: odometer,
      values: expect.objectContaining({ odometer_km: '50250' }),
    });
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('AC-07: every fuel.* key on the odometer/review/submit path is translated', () => {
    const keys = [
      'receipt_required',
      'odometer_required',
      'submit_error',
      'save_draft',
      'no_receipt_image',
      'no_odometer_image',
      'full_review_hint',
      'odometer_attached',
      'odometer_required_for_submit',
      'submit_evidence_required',
      'odometer_photo_label',
      'odometer_simple_hint',
      'odometer_km',
      'last_odometer',
      'step_odometer',
      'step_review',
      'receipt',
      'odometer',
      'total_amount',
      'submit_for_review',
      'submitted_success',
    ];
    for (const [locale, resource] of Object.entries({ uz, ru, en })) {
      const fuel = (resource as { fuel: Record<string, unknown> }).fuel;
      for (const key of keys) {
        const value = fuel[key];
        expect(
          typeof value === 'string' && value.trim().length > 0,
          `${locale}: fuel.${key}`,
        ).toBe(true);
      }
    }
  });
});
