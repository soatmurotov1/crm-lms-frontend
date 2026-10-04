import {
  render,
  screen,
  fireEvent,
  cleanup,
  within,
  act,
} from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { CreateLeadDialog } from './CreateLeadDialog';
import { leadsApi } from '../api/leadsApi';
import type { LeadStage, CompanyLeadSource } from '../types/leads.types';
import en from '@/i18n/locales/en.json';
import ru from '@/i18n/locales/ru.json';
import uz from '@/i18n/locales/uz.json';

const state = vi.hoisted(() => ({
  locale: 'en' as 'en' | 'ru' | 'uz',
  mutate: vi.fn(),
  pending: false,
  stages: [] as LeadStage[] | undefined,
  isPending: false,
  isFetching: false,
  isError: false,
  refetch: vi.fn(),
  sources: [] as CompanyLeadSource[],
  branches: [{ id: 'branch-1', name: 'Chilonzor' }],
  activeBranchId: null as string | null,
  user: { role: 'owner', branch_id: 'branch-1' as string | null },
  success: vi.fn(),
  error: vi.fn(),
}));
const resources = { en, ru, uz };
const translate = (key: string, fallback?: unknown) => {
  const value = key
    .split('.')
    .reduce<unknown>(
      (obj, part) =>
        obj && typeof obj === 'object'
          ? (obj as Record<string, unknown>)[part]
          : undefined,
      resources[state.locale],
    );
  return typeof value === 'string'
    ? value
    : typeof fallback === 'string'
      ? fallback
      : key;
};
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: translate }) }));
vi.mock('../queries/leadsQueries', () => ({
  useCreateLeadMutation: () => ({
    mutate: state.mutate,
    isPending: state.pending,
  }),
  useLeadStagesQuery: () => ({
    data: state.stages,
    isPending: state.isPending,
    isFetching: state.isFetching,
    isError: state.isError,
    refetch: state.refetch,
  }),
  useLeadSourcesQuery: () => ({ data: state.sources }),
}));
vi.mock('@/features/branches/api/branchService', () => ({
  useBranches: () => ({ data: state.branches }),
}));
vi.mock('@/features/staff/api/teacherService', () => ({
  useTeachers: () => ({ data: [] }),
}));
vi.mock('@/features/staff/api/operatorService', () => ({
  useOperators: () => ({ data: [] }),
}));
vi.mock('@/features/students/api/studentService', () => ({
  useStudents: () => ({ data: [] }),
}));
vi.mock('@/store/authStore', () => ({
  useAuthStore: Object.assign(
    (selector: (s: typeof state) => unknown) => selector(state),
    { getState: () => state },
  ),
}));
vi.mock('sonner', () => ({
  toast: { success: state.success, error: state.error },
}));
const stage = (
  id: string,
  kind: LeadStage['kind'] = 'WORK',
  isActive = true,
): LeadStage => ({
  id,
  name: id,
  kind,
  isActive,
  companyId: 'company-1',
  position: 1,
  color: '#3b82f6',
  isSystem: false,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
});
const props = { open: true, onOpenChange: vi.fn() };
const show = (defaultStageId?: string) =>
  render(<CreateLeadDialog {...props} defaultStageId={defaultStageId} />);
const input = (id: string) => document.getElementById(id) as HTMLInputElement;
const fill = () => {
  fireEvent.change(input('lead-first-name'), { target: { value: 'Sardor' } });
  fireEvent.change(input('lead-phone'), { target: { value: '+998901112233' } });
};
const choose = (id: string, name: string) => {
  fireEvent.click(document.getElementById(id)!);
  fireEvent.click(within(screen.getByRole('listbox')).getByText(name));
};
const submit = () =>
  fireEvent.submit(input('lead-first-name').closest('form')!);
const save = () =>
  screen.getByRole('button', { name: translate('common.save') });
const ready = () => {
  fill();
  choose('lead-source', translate('leads.sources.telegram'));
};
beforeEach(() => {
  vi.clearAllMocks();
  state.locale = 'en';
  state.pending = false;
  state.stages = [stage('stage-1'), stage('stage-2')];
  state.isPending = false;
  state.isFetching = false;
  state.isError = false;
  state.sources = [];
  state.branches = [{ id: 'branch-1', name: 'Chilonzor' }];
  state.activeBranchId = null;
  state.user = { role: 'owner', branch_id: 'branch-1' };
  vi.spyOn(leadsApi, 'checkDuplicate').mockResolvedValue({
    hasDuplicate: false,
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('CreateLeadDialog initial choices', () => {
  it.each(['uz', 'ru', 'en'] as const)(
    'opens with visible required blank source in %s',
    (locale) => {
      state.locale = locale;
      show();
      expect(
        screen.getByRole('heading', { name: translate('leads.create_lead') }),
      ).toBeInTheDocument();
      expect(document.getElementById('lead-source')).toHaveTextContent(
        translate('leads.select_source'),
      );
      expect(document.getElementById('lead-source')).toHaveAttribute(
        'aria-required',
        'true',
      );
      expect(
        screen.getByRole('combobox', {
          name: new RegExp(translate('leads.source')),
        }),
      ).toBeInTheDocument();
      fill();
      expect(save()).toBeDisabled();
      submit();
      expect(state.mutate).not.toHaveBeenCalled();
    },
  );

  it.each([
    'telegram',
    'instagram',
    'referral',
    'directory_map',
    'olx',
    'walk_in',
    'other',
  ])('deliberately sends %s with active stage and unchanged IDs', (source) => {
    show();
    fill();
    choose('lead-source', translate(`leads.sources.${source}`));
    if (source === 'other')
      fireEvent.change(input('lead-source-other'), {
        target: { value: ' Local fair ' },
      });
    fireEvent.click(save());
    expect(state.mutate).toHaveBeenCalledTimes(1);
    expect(state.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'Sardor',
        phone: '+998901112233',
        branchId: 'branch-1',
        stageId: 'stage-1',
        source,
        sourceOther: source === 'other' ? 'Local fair' : undefined,
      }),
      expect.any(Object),
    );
  });

  it('preserves custom source mapping to other plus detail', () => {
    state.sources = [
      {
        id: 'custom-1',
        name: 'Community fair',
        isSystem: false,
        isActive: true,
        createdAt: '2026-01-01',
      },
    ];
    show();
    fill();
    choose('lead-source-custom', 'Community fair');
    submit();
    expect(state.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'other',
        sourceOther: 'Community fair',
      }),
      expect.any(Object),
    );
  });

  it.each(['stage-2', 'won', 'inactive', 'legacy', 'missing'])(
    'resolves %s default only through active work choices',
    (defaultStage) => {
      state.stages = [
        stage('won', 'WON'),
        stage('inactive', 'WORK', false),
        stage('legacy', 'NEW'),
        stage('lost', 'LOST'),
        stage('stage-1'),
        stage('stage-2'),
      ];
      show(defaultStage);
      ready();
      fireEvent.click(document.getElementById('lead-stage')!);
      expect(
        screen.getAllByRole('option').map((option) => option.textContent),
      ).toEqual(['stage-1', 'stage-2']);
      fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' });
      submit();
      expect(state.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          stageId: defaultStage === 'stage-2' ? 'stage-2' : 'stage-1',
        }),
        expect.any(Object),
      );
    },
  );

  it('requires fresh choice after an explicitly selected stage disappears', () => {
    const view = show();
    ready();
    choose('lead-stage', 'stage-2');
    state.stages = [stage('stage-1')];
    view.rerender(<CreateLeadDialog {...props} />);
    expect(document.getElementById('lead-stage')).toHaveTextContent(
      translate('leads.select_stage'),
    );
    expect(save()).toBeDisabled();
    submit();
    expect(state.mutate).not.toHaveBeenCalled();
    state.stages = [stage('stage-1'), stage('stage-2')];
    view.rerender(<CreateLeadDialog {...props} />);
    expect(save()).toBeDisabled();
    choose('lead-stage', 'stage-1');
    submit();
    expect(state.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ stageId: 'stage-1' }),
      expect.any(Object),
    );
  });

  it.each([
    ['loading', undefined, true, false, false, 'initial_stages_loading'],
    [
      'refetch',
      [stage('stage-1')],
      false,
      true,
      false,
      'initial_stages_refreshing',
    ],
    ['error', undefined, false, false, true, 'initial_stages_error'],
    [
      'stale error',
      [stage('stage-1')],
      false,
      false,
      true,
      'initial_stages_error',
    ],
    ['empty', [], false, false, false, 'initial_stages_empty'],
    [
      'terminal only',
      [stage('won', 'WON')],
      false,
      false,
      false,
      'initial_stages_empty',
    ],
  ] as const)(
    'blocks %s stage eligibility and renders its prerequisite',
    (_name, data, pending, fetching, error, key) => {
      state.stages = data ? [...data] : undefined;
      state.isPending = pending;
      state.isFetching = fetching;
      state.isError = error;
      show();
      ready();
      expect(screen.getByText(translate(`leads.${key}`))).toBeInTheDocument();
      expect(save()).toBeDisabled();
      submit();
      expect(state.mutate).not.toHaveBeenCalled();
      if (error) {
        fireEvent.click(
          screen.getByRole('button', { name: translate('common.retry') }),
        );
        expect(state.refetch).toHaveBeenCalledTimes(1);
      }
    },
  );

  it('retains the initial fallback when Radix emits an empty native value after loading', () => {
    state.isPending = true;
    state.stages = undefined;
    const view = show();
    ready();
    expect(save()).toBeDisabled();
    state.isPending = false;
    state.stages = [stage('stage-1'), stage('stage-2')];
    view.rerender(<CreateLeadDialog {...props} />);
    // Radix's hidden native select bubbles an empty change as its options settle.
    const nativeStageSelect = document
      .getElementById('lead-stage')!
      .parentElement!.querySelector('select')!;
    expect(nativeStageSelect).toBeInstanceOf(HTMLSelectElement);
    fireEvent.change(nativeStageSelect, { target: { value: '' } });
    expect(document.getElementById('lead-stage')).toHaveTextContent('stage-1');
    expect(
      screen.queryByText(translate('leads.initial_stage_reselect')),
    ).not.toBeInTheDocument();
    expect(save()).toBeEnabled();
    submit();
    expect(state.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ stageId: 'stage-1' }),
      expect.any(Object),
    );
  });

  it('retains an explicit stage through unsettled query states', () => {
    const view = show();
    ready();
    choose('lead-stage', 'stage-2');
    state.isFetching = true;
    state.stages = undefined;
    view.rerender(<CreateLeadDialog {...props} />);
    expect(save()).toBeDisabled();
    state.isFetching = false;
    state.stages = [stage('stage-1'), stage('stage-2')];
    view.rerender(<CreateLeadDialog {...props} />);
    expect(document.getElementById('lead-source')).toHaveTextContent(
      'Telegram',
    );
    expect(document.getElementById('lead-stage')).toHaveTextContent('stage-2');
    submit();
    expect(state.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ stageId: 'stage-2' }),
      expect.any(Object),
    );
  });

  it('blocks a selected stage deactivated immediately before submit', () => {
    const view = show();
    ready();
    choose('lead-stage', 'stage-2');
    state.stages = [stage('stage-1'), stage('stage-2', 'WORK', false)];
    view.rerender(<CreateLeadDialog {...props} />);
    submit();
    expect(state.mutate).not.toHaveBeenCalled();
    expect(save()).toBeDisabled();
  });

  it('recovers stage loading/error to ready without discarding source', () => {
    state.isError = true;
    const view = show();
    ready();
    fireEvent.click(
      screen.getByRole('button', { name: translate('common.retry') }),
    );
    state.isError = false;
    view.rerender(<CreateLeadDialog {...props} />);
    expect(save()).toBeEnabled();
    submit();
    expect(state.mutate).toHaveBeenCalledTimes(1);
  });

  it.each(['cancel', 'close', 'escape'])(
    'resets source and draft after %s then reopen',
    (route) => {
      const view = show();
      ready();
      if (route === 'escape')
        fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
      else
        fireEvent.click(
          screen.getByRole('button', { name: translate(`common.${route}`) }),
        );
      expect(props.onOpenChange).toHaveBeenCalledWith(false);
      view.rerender(
        <CreateLeadDialog open={false} onOpenChange={props.onOpenChange} />,
      );
      view.rerender(<CreateLeadDialog {...props} />);
      expect(input('lead-first-name')).toHaveValue('');
      expect(document.getElementById('lead-source')).toHaveTextContent(
        translate('leads.select_source'),
      );
    },
  );

  it('resets on external close/reopen and ignores retired success/error callbacks', () => {
    const onCreated = vi.fn();
    const view = render(<CreateLeadDialog {...props} onCreated={onCreated} />);
    ready();
    submit();
    const callbacks = state.mutate.mock.calls[0][1];
    view.rerender(
      <CreateLeadDialog
        open={false}
        onOpenChange={props.onOpenChange}
        onCreated={onCreated}
      />,
    );
    view.rerender(<CreateLeadDialog {...props} onCreated={onCreated} />);
    ready();
    fireEvent.change(input('lead-first-name'), {
      target: { value: 'New draft' },
    });
    act(() => {
      callbacks.onSuccess({ id: 'old-lead' });
      callbacks.onError(new Error('Old error'));
    });
    expect(input('lead-first-name')).toHaveValue('New draft');
    expect(props.onOpenChange).not.toHaveBeenCalled();
    expect(onCreated).not.toHaveBeenCalled();
    expect(state.success).not.toHaveBeenCalled();
    expect(state.error).not.toHaveBeenCalled();
    submit();
    expect(state.mutate).toHaveBeenCalledTimes(2);
  });

  it('resets on current success but preserves source/detail on failure and intentional retry', () => {
    const onCreated = vi.fn();
    const view = render(<CreateLeadDialog {...props} onCreated={onCreated} />);
    ready();
    submit();
    act(() =>
      state.mutate.mock.calls[0][1].onError(new Error('Synthetic failure')),
    );
    expect(input('lead-first-name')).toHaveValue('Sardor');
    expect(document.getElementById('lead-source')).toHaveTextContent(
      'Telegram',
    );
    expect(props.onOpenChange).not.toHaveBeenCalled();
    submit();
    expect(state.mutate).toHaveBeenCalledTimes(2);
    act(() => state.mutate.mock.calls[1][1].onSuccess({ id: 'new-lead' }));
    expect(props.onOpenChange).toHaveBeenCalledWith(false);
    expect(onCreated).toHaveBeenCalledWith('new-lead');
    view.rerender(
      <CreateLeadDialog open={false} onOpenChange={props.onOpenChange} />,
    );
    view.rerender(<CreateLeadDialog {...props} />);
    expect(document.getElementById('lead-source')).toHaveTextContent(
      translate('leads.select_source'),
    );
  });

  it('blocks repeated direct submission and pending Cancel/X/Escape dismissal', () => {
    show();
    ready();
    submit();
    submit();
    expect(state.mutate).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole('button', { name: translate('common.saving') }),
    ).toBeDisabled();
    fireEvent.click(
      screen.getByRole('button', { name: translate('common.cancel') }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: translate('common.close') }),
    );
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(props.onOpenChange).not.toHaveBeenCalled();
  });

  it('guards direct submit and dismissal while the mutation hook is pending', () => {
    state.pending = true;
    show();
    ready();
    submit();
    fireEvent.click(
      screen.getByRole('button', { name: translate('common.close') }),
    );
    expect(state.mutate).not.toHaveBeenCalled();
    expect(props.onOpenChange).not.toHaveBeenCalled();
  });

  it('guards direct submission until a duplicate is acknowledged', async () => {
    vi.mocked(leadsApi.checkDuplicate).mockResolvedValue({
      hasDuplicate: true,
      duplicateLead: {
        id: 'dup-1',
        firstName: 'Bobur',
        lastName: null,
        stageName: 'stage-1',
      },
    });
    show();
    ready();
    await screen.findByText(translate('leads.duplicate_detected'));
    submit();
    expect(state.mutate).not.toHaveBeenCalled();
    fireEvent.click(document.getElementById('ack-duplicate-checkbox')!);
    submit();
    expect(state.mutate).toHaveBeenCalledTimes(1);
  });

  it.each([
    [null, 'branch-1', 'branch-1'],
    ['branch-2', 'branch-1', 'branch-2'],
    [null, null, 'branch-1'],
  ])(
    'preserves existing active/home/first branch fallback (%s, %s)',
    (active, home, expected) => {
      state.activeBranchId = active;
      state.user.branch_id = home;
      state.branches = [
        { id: 'branch-1', name: 'Chilonzor' },
        { id: 'branch-2', name: 'Second branch' },
      ];
      show();
      ready();
      submit();
      expect(state.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ branchId: expected }),
        expect.any(Object),
      );
    },
  );
});
