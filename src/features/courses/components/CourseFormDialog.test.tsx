import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CourseFormDialog from './CourseFormDialog';
import type { Course } from '@/features/courses/types';
import type { Branch } from '@/features/branches/types';
import en from '@/i18n/locales/en.json';
import ru from '@/i18n/locales/ru.json';
import uz from '@/i18n/locales/uz.json';

const state = vi.hoisted(() => ({
  locale: 'en' as 'en' | 'ru' | 'uz',
  pending: false,
  scoped: false,
  branches: [{ id: 'b1', name: 'Allowed branch' }],
  create: vi.fn(),
  update: vi.fn(),
  error: vi.fn(),
}));
const resources = { en, ru, uz };
const translate = (key: string): string =>
  (key
    .split('.')
    .reduce<unknown>(
      (value, part) =>
        value && typeof value === 'object'
          ? (value as Record<string, unknown>)[part]
          : undefined,
      resources[state.locale],
    ) as string) || key;
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: translate }) }));
vi.mock('@/features/courses/api/courseService', () => ({
  useCreateCourse: () => ({ mutate: state.create, isPending: state.pending }),
  useUpdateCourse: () => ({ mutate: state.update, isPending: state.pending }),
}));
vi.mock('@/hooks/useWriteOptions', () => ({
  useWriteOptions: () => ({ scoped: state.scoped, branches: state.branches }),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: state.error } }));
const course: Course = {
  id: 'c1',
  name: 'Synthetic course',
  branch_id: 'b1',
  course_type: 'offline',
  price: 1500000,
  duration_days: 60,
  is_active: true,
  created_at: '2026-07-01T00:00:00Z',
};
const branches = [
  { id: 'b1', name: 'Allowed branch' },
  { id: 'b2', name: 'Other branch' },
] as Branch[];
const show = (editCourse: Course | null = null, onClose = vi.fn()) =>
  render(
    <CourseFormDialog
      open
      editCourse={editCourse}
      branches={branches}
      onClose={onClose}
    />,
  );
const input = (name: string) =>
  document.querySelector(`input[name="${name}"]`) as HTMLInputElement;
const save = () =>
  screen.getByRole('button', { name: translate('common.save') });
const fill = async () => {
  fireEvent.change(input('name'), { target: { value: course.name } });
  fireEvent.click(
    screen.getByRole('combobox', { name: translate('common.branch') }),
  );
  fireEvent.click(
    within(screen.getByRole('listbox')).getByText('Allowed branch'),
  );
  fireEvent.change(input('price'), { target: { value: '1500000' } });
  fireEvent.change(input('durationDays'), { target: { value: '60' } });
};
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  state.locale = 'en';
  state.pending = false;
  state.scoped = false;
  state.branches = [{ id: 'b1', name: 'Allowed branch' }];
});

describe('CourseFormDialog units', () => {
  it.each([
    ['en', 'Price (UZS)', 'Duration (days)'],
    ['ru', 'Цена (сум)', 'Длительность (дни)'],
    ['uz', "Narxi (so'm)", 'Davomiyligi (kun)'],
  ] as const)(
    'associates visible %s units in create and edit forms',
    (locale, price, duration) => {
      state.locale = locale;
      const view = show();
      expect(screen.getByRole('textbox', { name: price })).toHaveValue('');
      expect(screen.getByRole('spinbutton', { name: duration })).toHaveValue(
        null,
      );
      fireEvent.change(input('price'), { target: { value: '1500000' } });
      expect(screen.getByRole('textbox', { name: price })).toHaveValue(
        '1 500 000',
      );
      expect(screen.getByText(price)).toBeVisible();
      expect(screen.getByText(duration)).toBeVisible();
      view.rerender(
        <CourseFormDialog
          open
          editCourse={course}
          branches={branches}
          onClose={vi.fn()}
        />,
      );
      expect(screen.getByRole('textbox', { name: price })).toHaveValue(
        '1 500 000',
      );
      expect(screen.getByRole('spinbutton', { name: duration })).toHaveValue(
        60,
      );
      expect(input('durationDays')).toHaveAttribute('min', '1');
      expect(input('durationDays')).toHaveAttribute('aria-required', 'true');
      expect(input('price')).toHaveAttribute('aria-required', 'true');
    },
  );

  it.each([false, true])(
    'preserves numeric payload for edit=%s with one dispatch',
    async (edit) => {
      show(edit ? course : null);
      if (!edit) await fill();
      fireEvent.click(save());
      const mutation = edit ? state.update : state.create;
      await waitFor(() => expect(mutation).toHaveBeenCalledTimes(1));
      expect(mutation).toHaveBeenCalledWith(
        {
          ...(edit ? { id: 'c1' } : {}),
          name: course.name,
          branch_id: 'b1',
          course_type: 'offline',
          price: 1500000,
          duration_days: 60,
          subject_id: null,
        },
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        }),
      );
      expect(edit ? state.create : state.update).not.toHaveBeenCalled();
    },
  );

  it.each(
    (['en', 'ru', 'uz'] as const).flatMap((locale) =>
      [false, true].flatMap((edit) =>
        ['', '0'].map((value) => ({ locale, edit, value })),
      ),
    ),
  )(
    'shows localized blank/zero errors via save: $locale edit=$edit value=$value',
    async ({ locale, edit, value }) => {
      state.locale = locale;
      show(edit ? course : null);
      if (!edit) await fill();
      fireEvent.change(input('price'), { target: { value } });
      fireEvent.change(input('durationDays'), { target: { value } });
      fireEvent.click(save());
      await waitFor(() =>
        expect(input('price')).toHaveAttribute('aria-invalid', 'true'),
      );
      expect(input('durationDays')).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getAllByText(translate('common.required'))).toHaveLength(2);
      expect(state.create).not.toHaveBeenCalled();
      expect(state.update).not.toHaveBeenCalled();
    },
  );

  it('validates every field when native duration zero blocks submit', async () => {
    show();
    fireEvent.change(input('durationDays'), { target: { value: '0' } });
    fireEvent.click(save());
    await waitFor(() =>
      expect(screen.getAllByText(translate('common.required'))).toHaveLength(4),
    );
    expect(state.create).not.toHaveBeenCalled();
    expect(state.update).not.toHaveBeenCalled();
    await fill();
    fireEvent.click(save());
    await waitFor(() => expect(state.create).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(translate('common.required'))).toBeNull();
  });

  it.each(['0.5', '1.5'])(
    'preserves native whole-day rejection and allows correction from %s',
    async (value) => {
      show(course);
      fireEvent.change(input('durationDays'), { target: { value } });
      const invalid = vi.fn();
      input('durationDays').addEventListener('invalid', invalid);
      fireEvent.click(save());
      expect(invalid).toHaveBeenCalledTimes(1);
      expect(invalid.mock.calls[0][0].defaultPrevented).toBe(false);
      expect(input('durationDays').validity.stepMismatch).toBe(true);
      expect(state.update).not.toHaveBeenCalled();
      fireEvent.change(input('durationDays'), { target: { value: '1' } });
      fireEvent.click(save());
      await waitFor(() => expect(state.update).toHaveBeenCalledTimes(1));
      expect(state.update.mock.calls[0][0].duration_days).toBe(1);
    },
  );

  it('keeps scoped branch options and an empty no-grant choice', () => {
    state.scoped = true;
    const view = show();
    fireEvent.click(
      screen.getByRole('combobox', { name: translate('common.branch') }),
    );
    expect(
      within(screen.getByRole('listbox')).getByText('Allowed branch'),
    ).toBeVisible();
    expect(
      within(screen.getByRole('listbox')).queryByText('Other branch'),
    ).toBeNull();
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' });
    state.branches = [];
    view.rerender(
      <CourseFormDialog
        open
        editCourse={null}
        branches={branches}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(
      screen.getByRole('combobox', { name: translate('common.branch') }),
    );
    expect(screen.queryByRole('option')).toBeNull();
  });

  it('preserves dirty cancel, keep editing, discard and fresh reopen', () => {
    const onClose = vi.fn();
    const view = show(null, onClose);
    fireEvent.change(input('name'), { target: { value: 'Unsaved course' } });
    fireEvent.click(
      screen.getByRole('button', { name: translate('common.cancel') }),
    );
    const confirm = screen.getByRole('dialog', {
      name: translate('common.discard_changes_title'),
    });
    fireEvent.click(
      within(confirm).getByRole('button', { name: translate('common.cancel') }),
    );
    expect(input('name')).toHaveValue('Unsaved course');
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole('button', { name: translate('common.cancel') }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: translate('common.discard') }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
    view.rerender(
      <CourseFormDialog
        open={false}
        editCourse={null}
        branches={branches}
        onClose={onClose}
      />,
    );
    view.rerender(
      <CourseFormDialog
        open
        editCourse={null}
        branches={branches}
        onClose={onClose}
      />,
    );
    expect(input('name')).toHaveValue('');
  });

  it('disables pending save after the first dispatch', async () => {
    const view = show(course);
    fireEvent.click(save());
    await waitFor(() => expect(state.update).toHaveBeenCalledTimes(1));
    state.pending = true;
    view.rerender(
      <CourseFormDialog
        open
        editCourse={course}
        branches={branches}
        onClose={vi.fn()}
      />,
    );
    const saving = screen.getByRole('button', {
      name: translate('common.saving'),
    });
    expect(saving).toBeDisabled();
    fireEvent.click(saving);
    expect(state.update).toHaveBeenCalledTimes(1);
    expect(state.create).not.toHaveBeenCalled();
  });

  it('keeps input after a failed update and allows a deliberate retry', async () => {
    const onClose = vi.fn();
    show(course, onClose);
    fireEvent.click(save());
    await waitFor(() => expect(state.update).toHaveBeenCalledTimes(1));
    state.update.mock.calls[0][1].onError({
      response: { data: { error: { message: 'Synthetic update failure' } } },
    });
    expect(state.error).toHaveBeenCalledWith('Synthetic update failure');
    expect(onClose).not.toHaveBeenCalled();
    expect(input('price')).toHaveValue('1 500 000');
    expect(input('durationDays')).toHaveValue(60);
    fireEvent.click(save());
    await waitFor(() => expect(state.update).toHaveBeenCalledTimes(2));
    expect(state.update.mock.calls[1][0]).toEqual(
      state.update.mock.calls[0][0],
    );
  });
});
