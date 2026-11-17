/* eslint-disable react-refresh/only-export-components -- small shared helpers live beside their components */
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { CircleNotch, Warning } from '@phosphor-icons/react';
import { Alert } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/lib/money';
import type { LearnerAttendanceStatus } from '@/features/learner/types';

const LOCALE: Record<string, string> = {
  uz: 'uz-UZ',
  ru: 'ru-RU',
  en: 'en-GB',
};

const localeOf = (lang: string) => LOCALE[lang.slice(0, 2)] ?? 'uz-UZ';

// Brauzerlarda `uz-UZ` oy/kun nomlari to'liq emas — o'zbekcha qo'lda.
const UZ_MONTHS = [
  'yan',
  'fev',
  'mar',
  'apr',
  'may',
  'iyun',
  'iyul',
  'avg',
  'sen',
  'okt',
  'noy',
  'dek',
];
const UZ_DAYS = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];

/** Toshkent vaqtidagi qismlar (UTC+5, yozgi vaqt yo'q). */
const tashkentParts = (value: string) => {
  const d = new Date(new Date(value).getTime() + 5 * 60 * 60 * 1000);
  return {
    day: d.getUTCDate(),
    month: d.getUTCMonth(),
    year: d.getUTCFullYear(),
    weekday: d.getUTCDay(),
    time: `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`,
  };
};

export const useLearnerFormat = () => {
  const { i18n } = useTranslation();
  const locale = localeOf(i18n.language);
  const isUz = locale === 'uz-UZ';
  const fmt = (
    value: string | null | undefined,
    options: Intl.DateTimeFormatOptions,
  ) =>
    value
      ? new Intl.DateTimeFormat(locale, {
          timeZone: 'Asia/Tashkent',
          ...options,
        }).format(new Date(value))
      : '—';
  const uz = (
    value: string | null | undefined,
    kind: 'date' | 'dayMonth' | 'dateTime',
  ) => {
    if (!value) return '—';
    const p = tashkentParts(value);
    const dm = `${p.day}-${UZ_MONTHS[p.month]}`;
    if (kind === 'dayMonth') return `${UZ_DAYS[p.weekday]}, ${dm}`;
    if (kind === 'dateTime') return `${dm}, ${p.time}`;
    return `${dm}, ${p.year}`;
  };
  return {
    date: (v: string | null | undefined) =>
      isUz
        ? uz(v, 'date')
        : fmt(v, { day: '2-digit', month: 'short', year: 'numeric' }),
    dayMonth: (v: string | null | undefined) =>
      isUz
        ? uz(v, 'dayMonth')
        : fmt(v, { weekday: 'short', day: '2-digit', month: 'short' }),
    time: (v: string | null | undefined) => (v ? tashkentParts(v).time : '—'),
    dateTime: (v: string | null | undefined) =>
      isUz
        ? uz(v, 'dateTime')
        : fmt(v, {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }),
    money: (v: string | number | null | undefined) =>
      formatMoney(Math.round(Number(v ?? 0))),
  };
};

export function LearnerPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3 border-b border-hair pb-4">
      <div className="min-w-0">
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {actions}
    </header>
  );
}

/** Yuklanish / xato / bo'sh holatlar uchun bitta o'ram. */
export function QueryState({
  isLoading,
  error,
  isEmpty,
  emptyText,
  children,
}: {
  isLoading: boolean;
  error: unknown;
  isEmpty?: boolean;
  emptyText?: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  if (isLoading) {
    return (
      <div className="flex justify-center py-16 text-muted-foreground">
        <CircleNotch
          aria-label="…"
          className="size-6 animate-spin motion-reduce:animate-none"
        />
      </div>
    );
  }
  if (error) {
    const status = (error as { response?: { status?: number } }).response
      ?.status;
    return (
      <Alert variant="destructive" className="flex items-center gap-2">
        <Warning aria-hidden className="size-4 shrink-0" />
        {status === 403
          ? t('learner.errors.section_disabled')
          : t('learner.errors.generic')}
      </Alert>
    );
  }
  if (isEmpty) {
    return (
      <p className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
        {emptyText}
      </p>
    );
  }
  return <>{children}</>;
}

const TONE = {
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/20 text-warning-strong',
  danger: 'bg-destructive/10 text-destructive',
  info: 'bg-info/10 text-info',
  muted: 'bg-muted text-muted-foreground',
} as const;

export type Tone = keyof typeof TONE;

export function Pill({
  tone = 'muted',
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-xs font-medium',
        TONE[tone],
      )}
    >
      {children}
    </span>
  );
}

export const ATTENDANCE_TONE: Record<LearnerAttendanceStatus, Tone> = {
  present: 'success',
  late: 'warning',
  absent: 'danger',
  excused: 'info',
};

export function AttendancePill({
  status,
}: {
  status: LearnerAttendanceStatus | null;
}) {
  const { t } = useTranslation();
  return (
    <Pill tone={status ? ATTENDANCE_TONE[status] : 'muted'}>
      {t(`learner.attendance_status.${status ?? 'none'}`)}
    </Pill>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-muted"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width]"
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}

export const errorMessage = (error: unknown, fallback: string): string => {
  const data = (
    error as {
      response?: { data?: { error?: { message?: string }; message?: string } };
    }
  )?.response?.data;
  return data?.error?.message ?? data?.message ?? fallback;
};
