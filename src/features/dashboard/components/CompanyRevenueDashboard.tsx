import { StatCard } from '@/components/ui/StatCard';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useUrlParams } from '@/hooks/useUrlParams';
import { useTranslation } from 'react-i18next';
import {
  Warning,
  ArrowDownRight,
  ArrowUpRight,
  Buildings,
  CalendarDot,
  CheckCircle,
  CaretRight,
  ClipboardText,
  Clock,
  GraduationCap,
  Hourglass,
  PiggyBank,
  ArrowsClockwise,
  ShieldCheck,
  UserCheck,
  UserMinus,
  UserPlus,
  UsersThree,
  Wallet,
  GasPump,
} from '@phosphor-icons/react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  CourseTypeTabs,
  type CourseTypeTab,
} from '@/components/ui/course-type-tabs';
import { useBranches } from '@/features/branches/api/branchService';
import {
  useCompanyOverview,
  useExpenseBreakdown,
  useFinanceSummary,
} from '@/features/dashboard/api/dashboardService';
import type {
  CompanyOverview,
  CompanyOverviewQuery,
} from '@/features/dashboard/api/dashboardService';
import { useAuthStore } from '@/store/authStore';
import { useCan } from '@/hooks/useCan';
import { isCrossTenantRole, requestBranchId } from '@/lib/permissions';
import { CourseType } from '@/features/students/types';
import { cn } from '@/lib/utils';
import {
  formatTashkentDate,
  isoToParts,
  nowTashkentParts,
} from '@/lib/calendarDateTime';
import { formatMoney, groupDigits } from '@/lib/money';
import { FinanceSummarySection } from '@/features/dashboard/components/FinanceSummarySection';

const RevenueTrendChart = lazy(
  () => import('@/features/dashboard/components/RevenueTrendChart'),
);

const FleetWorkloadOperationsCenter = lazy(
  () => import('@/features/dashboard/components/FleetWorkloadOperationsCenter'),
);

const UZ_TIMEZONE = 'Asia/Tashkent';
const freshnessTimestampFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: UZ_TIMEZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const formatFreshnessTimestamp = (value: string | Date) => {
  const parts = freshnessTimestampFormatter.formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? '';

  return `${part('day')}.${part('month')}.${part('year')} ${part('hour')}:${part('minute')}`;
};

// Keep the v2 chunk independent from the legacy DashboardPage module.
const greetingKey = () => {
  const h = Number(nowTashkentParts().time.slice(0, 2));
  if (h < 12) return 'dashboard.greeting_morning';
  if (h < 18) return 'dashboard.greeting_afternoon';
  return 'dashboard.greeting_evening';
};

// Uzbek Intl short month names are unreliable in some browsers.
const UZ_MONTH_ABBR = [
  'YAN',
  'FEV',
  'MAR',
  'APR',
  'MAY',
  'IYUN',
  'IYUL',
  'AVG',
  'SEN',
  'OKT',
  'NOY',
  'DEK',
];
const uzDateParts = (value: string) => {
  const date = value.length === 10 ? value : isoToParts(value).date;
  const [year, month, day] = date.split('-');
  return { day, month: UZ_MONTH_ABBR[Number(month) - 1], year };
};

const DAY_MS = 86_400_000;
/** Whole days between `iso` and now, or null when there's no date to diff. */
const daysSince = (iso?: string | null): number | null =>
  iso ? Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS) : null;

type DebtTone = 'danger' | 'warning' | 'success';
/** Recovery-queue priority dot tone — mock thresholds: never-paid or either
 *  amount/age past a bucket line pushes the row up a tone. */
const debtPriorityTone = (
  debt: number,
  overdueDays: number | null,
): DebtTone => {
  if (overdueDays === null || debt >= 2_000_000 || overdueDays >= 14)
    return 'danger';
  if (debt >= 1_000_000 || overdueDays >= 7) return 'warning';
  return 'success';
};
const DEBT_TONE_VAR: Record<DebtTone, string> = {
  danger: 'hsl(var(--chart-danger))',
  warning: 'hsl(var(--chart-warning))',
  success: 'hsl(var(--chart-success))',
};

// en-CA formatter always renders YYYY-MM-DD — cache it once like
// moneyFormatter instead of constructing it on every call.
const uzDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: UZ_TIMEZONE,
});

const todayInUz = () => uzDateFormatter.format(new Date());

const startOfMonthInUz = () => {
  const today = todayInUz();
  return `${today.slice(0, 8)}01`;
};

const getSearchQuery = (
  params: URLSearchParams,
  branchId?: string,
  userBranchId?: string,
): CompanyOverviewQuery => ({
  branchId: branchId || userBranchId,
  courseType: (params.get('course_type') || undefined) as
    CourseType | undefined,
  from: params.get('from') || undefined,
  to: params.get('to') || undefined,
  granularity: params.get('granularity') === 'week' ? 'week' : 'day',
});

// `ink` = Design.md "on accent surfaces, text/icons use ink" rule — the
// primary/gradient KPI tile keeps this chip in ink tone regardless of delta
// sign, since a red/green chip on the amber gradient reads as a second
// clashing accent. Non-primary callers omit `ink` and keep semantic colors.
const DeltaChip = ({
  delta,
  ink = false,
}: {
  delta: number;
  ink?: boolean;
}) => (
  <span
    data-testid="kpi-delta"
    className={cn(
      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums',
      ink
        ? 'bg-primary-foreground/[14%] text-primary-foreground'
        : delta < 0
          ? 'bg-destructive/[14%] text-destructive dark:text-foreground'
          : 'bg-success/[14%] text-success dark:text-foreground',
    )}
  >
    {delta < 0 ? (
      <ArrowDownRight className="h-3 w-3" aria-hidden="true" />
    ) : (
      <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
    )}
    {delta >= 0 ? '+' : ''}
    {delta}%
  </span>
);

const FilterBar = ({
  params,
  canViewAllBranches,
  branches,
  onChange,
  onRefresh,
  isFetching,
}: {
  params: URLSearchParams;
  canViewAllBranches: boolean;
  branches: Array<{ id: string; name: string }>;
  onChange: (key: string, value?: string) => void;
  onRefresh: () => void;
  isFetching: boolean;
}) => {
  const { t } = useTranslation();
  const today = todayInUz();
  const from = params.get('from') || startOfMonthInUz();
  const to = params.get('to') || today;
  const controlClassName =
    'h-11 cursor-pointer rounded-md border border-border bg-card px-2.5 text-sm transition-[background-color,border-color] duration-150 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-10';
  return (
    <div
      data-tour="crm-dashboard"
      className="flex min-w-0 flex-wrap items-center gap-2 border-b border-hair pb-4"
    >
      <DateRangePicker
        from={from}
        to={to}
        max={today}
        onChange={(nextFrom, nextTo) => {
          // Always one updateParam('range') so from/to stay in sync
          // (same batching rule as autodrive-6cq.5.70).
          const f = nextFrom ?? startOfMonthInUz();
          const t = nextTo ?? today;
          onChange('range', `${f <= t ? f : t}|${f <= t ? t : f}`);
        }}
        aria-label={t('dashboard.v2.date_range', "Sana oralig'i")}
        className="h-11 max-w-full gap-1.5 sm:h-10"
      />
      {canViewAllBranches && (
        <select
          aria-label={t('dashboard.v2.branch', 'Filial')}
          value={params.get('branch_id') || 'all'}
          onChange={(event) =>
            onChange(
              'branch_id',
              event.target.value === 'all' ? undefined : event.target.value,
            )
          }
          className={cn(controlClassName, 'w-full sm:w-auto lg:hidden')}
        >
          <option value="all">
            {t('common.all_branches', 'Barcha filiallar')}
          </option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
      )}
      <CourseTypeTabs
        value={(params.get('course_type') as CourseTypeTab) || 'all'}
        onChange={(value) =>
          onChange('course_type', value === 'all' ? undefined : value)
        }
        className="w-full min-w-0 sm:w-auto"
        listClassName="h-11 w-full sm:h-10"
      />
      <select
        aria-label={t('dashboard.v2.granularity', 'Granulyarlik')}
        value={params.get('granularity') === 'week' ? 'week' : 'day'}
        onChange={(event) => onChange('granularity', event.target.value)}
        className={controlClassName}
      >
        <option value="day">{t('dashboard.v2.daily', 'Kunlik')}</option>
        <option value="week">{t('dashboard.v2.weekly', 'Haftalik')}</option>
      </select>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-11 w-11 rounded-md"
        onClick={onRefresh}
        disabled={isFetching}
        aria-label={t('dashboard.v2.refresh', 'Yangilash')}
        title={t('dashboard.v2.refresh', 'Yangilash')}
      >
        <ArrowsClockwise
          className={cn('h-4 w-4', isFetching && 'animate-spin')}
        />
      </Button>
    </div>
  );
};

const FreshnessCaption = ({
  generated_at,
  data_through,
}: CompanyOverview['freshness']) => {
  const { t } = useTranslation();
  const generatedAt = new Date(generated_at);
  const dataThrough = data_through ? new Date(data_through) : null;
  const showDataThrough =
    dataThrough !== null && dataThrough.getTime() < generatedAt.getTime();

  return (
    <div
      data-testid="dashboard-freshness-caption"
      className="inline-flex items-center gap-2 font-mono text-[11px] font-medium text-muted-foreground"
    >
      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>
        {t('dashboard.v2.updated', 'Hisobot tuzildi')} ·{' '}
        {formatFreshnessTimestamp(generatedAt)}
        {showDataThrough && (
          <>
            {' '}
            · {t('dashboard.v2.data_through', "Ma'lumotlar sanasi")}{' '}
            {formatFreshnessTimestamp(dataThrough)}
          </>
        )}
      </span>
    </div>
  );
};

const EmptyData = ({
  message,
  onReset,
}: {
  message?: string;
  onReset?: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <div className="grid min-h-48 place-items-center gap-2 rounded-lg border border-dashed border-border/80 bg-muted/10 p-4 text-center text-sm text-muted-foreground">
      <span>{message ?? t('common.no_data', "Ma'lumot topilmadi")}</span>
      {onReset && (
        <Button type="button" variant="ghost" size="sm" onClick={onReset}>
          {t('common.clear', 'Tozalash')}
        </Button>
      )}
    </div>
  );
};

const LegendRow = ({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) => (
  <div className="flex items-center gap-2">
    <span
      className="h-[9px] w-[9px] shrink-0 rounded-[3px]"
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
    <span className="flex-1 text-[12.5px] font-semibold">{label}</span>
    <span className="font-mono text-xs tabular-nums text-muted-foreground">
      {value}
    </span>
  </div>
);

// Payment status donut (mock section 5) — inline SVG, not Recharts: fixed
// r54/stroke16 geometry per spec, round-capped segments with a fixed gap.
const DONUT_R = 54;
const DONUT_STROKE = 16;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_R;
const DONUT_GAP = 8; // ponytail: tuned constant clearing the round-cap overlap between segments

const PaymentStatusDonut = ({
  paid,
  partial,
  debt,
  coverageRate,
}: {
  paid: number;
  partial: number;
  debt: number;
  coverageRate: number;
}) => {
  const { t } = useTranslation();
  const total = paid + partial + debt;
  const segments = [
    { value: paid, color: 'hsl(var(--chart-success))' },
    { value: partial, color: 'hsl(var(--chart-warning))' },
    { value: debt, color: 'hsl(var(--chart-danger))' },
  ].filter((segment) => segment.value > 0);
  const size = (DONUT_R + DONUT_STROKE / 2) * 2;
  const center = size / 2;
  let cursor = 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={t(
          'dashboard.v2.coverage_bar_label',
          '{{rate}}% to‘liq to‘langan',
          { rate: coverageRate },
        )}
      >
        <g transform={`rotate(-90 ${center} ${center})`}>
          <circle
            cx={center}
            cy={center}
            r={DONUT_R}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={DONUT_STROKE}
          />
          {total > 0 &&
            segments.map((segment, index) => {
              const rawLength = (segment.value / total) * DONUT_CIRCUMFERENCE;
              const length = Math.max(
                rawLength - (segments.length > 1 ? DONUT_GAP : 0),
                0,
              );
              const offset = -cursor;
              cursor += rawLength;
              return (
                <circle
                  key={index}
                  cx={center}
                  cy={center}
                  r={DONUT_R}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={DONUT_STROKE}
                  strokeLinecap="round"
                  strokeDasharray={`${length} ${DONUT_CIRCUMFERENCE - length}`}
                  strokeDashoffset={offset}
                />
              );
            })}
        </g>
      </svg>
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="num text-[26px] font-extrabold leading-none">
            {coverageRate}%
          </p>
          <p className="mt-1 font-mono text-[8.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            {t('dashboard.v2.coverage_short', 'Qamrov')}
          </p>
        </div>
      </div>
    </div>
  );
};

const DashboardChrome = ({
  data,
  user,
  canViewAllBranches,
  branches,
  params,
  updateParam,
  refetch,
  isFetching,
}: {
  data?: CompanyOverview;
  user: ReturnType<typeof useAuthStore.getState>['user'];
  canViewAllBranches: boolean;
  branches: Array<{ id: string; name: string }>;
  params: URLSearchParams;
  updateParam: (key: string, value?: string) => void;
  refetch: () => unknown;
  isFetching: boolean;
}) => {
  const { t } = useTranslation();
  return (
    <>
      <header className="flex flex-col gap-4 border-b border-hair pb-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          {data ? (
            <FreshnessCaption {...data.freshness} />
          ) : (
            <div className="h-4" aria-hidden="true" />
          )}
          <h1 className="mt-2 break-words font-heading text-2xl font-semibold leading-tight tracking-[-0.02em] text-balance sm:text-3xl">
            {t(greetingKey())}
            {user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty">
            {t(
              'dashboard.hero_sub',
              '{{count}} ta talaba joriy holatda qarzdor.',
              { count: data?.kpis.debt.students_with_debt ?? 0 },
            )}
          </p>
        </div>

        <div className="flex w-full min-w-0 flex-wrap gap-2 xl:w-auto xl:justify-end">
          {(canViewAllBranches
            ? ([
                {
                  to: '/payments',
                  search: {},
                  icon: Wallet,
                  tileClass: 'bg-primary/[14%] text-warning-strong',
                  label: t('nav.payments', "To'lovlar"),
                },
                {
                  to: '/branches',
                  search: {},
                  icon: Buildings,
                  tileClass: 'bg-info/[14%] text-info',
                  label: t('nav.branches', 'Filiallar'),
                },
                {
                  to: '/audit',
                  search: {},
                  icon: ShieldCheck,
                  tileClass: 'bg-success/[14%] text-success',
                  label: t('nav.audit', 'Audit log'),
                },
              ] as const)
            : ([
                {
                  to: '/payments',
                  search: { action: 'create' },
                  icon: Wallet,
                  // Full static class strings: Tailwind does not generate
                  // interpolated utilities such as `bg-${tone}`.
                  tileClass: 'bg-primary/[14%] text-warning-strong',
                  label: t(
                    'dashboard.v2.quick_action_payment',
                    "To'lov qabul qilish",
                  ),
                },
                {
                  to: '/students',
                  search: { action: 'create' },
                  icon: UserPlus,
                  tileClass: 'bg-info/[14%] text-info',
                  label: t(
                    'dashboard.v2.quick_action_student',
                    "Talaba qo'shish",
                  ),
                },
                {
                  to: '/attendance',
                  search: {},
                  icon: UsersThree,
                  tileClass: 'bg-success/[14%] text-success',
                  label: t(
                    'dashboard.v2.quick_action_attendance',
                    'Davomat olish',
                  ),
                },
              ] as const)
          ).map((action) => (
            <Link
              key={action.to}
              to={action.to}
              search={action.search}
              className="flex min-h-11 min-w-0 max-w-full cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium motion-safe:transition-[background-color,border-color,scale] hover:bg-muted active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-10"
            >
              <span
                className={cn(
                  'grid h-6 w-6 shrink-0 place-items-center rounded-md',
                  action.tileClass,
                )}
                aria-hidden="true"
              >
                <action.icon className="h-4 w-4" />
              </span>
              {action.label}
            </Link>
          ))}
        </div>
      </header>

      <FilterBar
        params={params}
        canViewAllBranches={canViewAllBranches}
        branches={branches}
        onChange={updateParam}
        onRefresh={() => void refetch()}
        isFetching={isFetching}
      />
    </>
  );
};

const CompanyRevenueDashboard = () => {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage || i18n.language || 'uz';
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const activeBranchId = useAuthStore((state) => state.activeBranchId);
  const canViewAllBranches = useCan('viewAllBranches');
  const { searchParams: params, setSearchParams: setParams } = useUrlParams();
  const isOwner = user?.role === 'owner';
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [checkedAt, setCheckedAt] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCheckedAt(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);
  const [branchSort, setBranchSort] = useState<
    'revenue' | 'active_students' | 'outstanding_debt' | 'collection_rate'
  >('revenue');
  const [detailView, setDetailView] = useState<
    'financial' | 'academic' | 'staff' | 'operations'
  >('financial');
  const { data: branches = [] } = useBranches(canViewAllBranches);
  const query = useMemo(
    () =>
      getSearchQuery(
        params,
        canViewAllBranches ? params.get('branch_id') || undefined : undefined,
        activeBranchId ?? user?.branch_id ?? undefined,
      ),
    [activeBranchId, canViewAllBranches, params, user],
  );
  const canReadDebtors = useCan('students.read', query.branchId ?? null);
  const debtorScopeMatches =
    isCrossTenantRole(user?.role) ||
    query.branchId === requestBranchId(user, activeBranchId);
  const { data, isLoading, isFetching, isError, refetch } =
    useCompanyOverview(query);
  const showFinanceSummary = user?.role === 'owner' || user?.role === 'manager';
  const financeQuery = useMemo(
    () => ({
      branchId: query.branchId,
      from: query.from || startOfMonthInUz(),
      to: query.to || todayInUz(),
    }),
    [query.branchId, query.from, query.to],
  );
  // The finance section stays behind the overview skeleton, but these GETs
  // must start now. Waiting for that return serializes finance behind overview.
  useFinanceSummary(financeQuery, showFinanceSummary);
  useExpenseBreakdown(financeQuery, showFinanceSummary);

  const updateParam = (key: string, value?: string) => {
    const next = new URLSearchParams(params);
    if (key === 'range') {
      const [from, to] = (value || '').split('|');
      if (from) next.set('from', from);
      else next.delete('from');
      if (to) next.set('to', to);
      else next.delete('to');
    } else if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  if (isLoading || isError || !data) {
    return (
      <div className="space-y-4 pb-8">
        <DashboardChrome
          data={data}
          user={user}
          canViewAllBranches={canViewAllBranches}
          branches={branches}
          params={params}
          updateParam={updateParam}
          refetch={refetch}
          isFetching={isFetching}
        />
        {isError ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : (
          <div role="status" aria-live="polite" aria-busy="true">
            <span className="sr-only">{t('common.loading')}</span>
            <DashboardSkeleton />
          </div>
        )}
      </div>
    );
  }

  const { kpis } = data;
  const statusTotal =
    kpis.collection.paid + kpis.collection.partial + kpis.collection.debt;
  const visibleRecoveryQueue = data.recovery_queue.slice(0, 3);
  const attendanceTotal = Object.values(
    data.operations.attendance_status,
  ).reduce((sum, value) => sum + value, 0);
  const sortedBranches = [...data.branch_performance].sort((a, b) => {
    const values = {
      revenue: [a.collected_revenue, b.collected_revenue],
      active_students: [a.active_students, b.active_students],
      outstanding_debt: [a.outstanding_debt, b.outstanding_debt],
      collection_rate: [a.collection_rate, b.collection_rate],
    }[branchSort];
    return values[1] - values[0];
  });
  // Keep dashboard drill-downs as typed route searches. The destination
  // pages use date_from/date_to; the dashboard's own filter names are from/to.
  const listSearch = {
    branch_id: query.branchId,
    course_type: query.courseType,
    date_from: query.from,
    date_to: query.to,
  };
  // API interval ends are exclusive; inclusive metadata is already final.
  const previousEnd =
    kpis.revenue.previous_period_to_inclusive ||
    (kpis.revenue.previous_period_to
      ? new Date(
          new Date(kpis.revenue.previous_period_to).getTime() - 1,
        ).toISOString()
      : undefined);
  // Compare complete calendar-day ranges only; unknown boundaries are neutral.
  const revenue = kpis.revenue;
  const calendarDay = (value?: string) => {
    if (!value) return undefined;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    try {
      return isoToParts(value).date;
    } catch {
      return undefined;
    }
  };
  const currentFrom = calendarDay(revenue.period_from || data.filters.from);
  const currentTo = calendarDay(revenue.period_to_inclusive);
  const previousFrom = calendarDay(revenue.previous_period_from);
  const previousTo = calendarDay(revenue.previous_period_to_inclusive);
  const canCompareRevenue = Boolean(
    revenue.previous_period > 0 &&
    currentFrom &&
    currentTo &&
    previousFrom &&
    previousTo &&
    currentTo < uzDateFormatter.format(new Date(checkedAt)) &&
    Date.parse(currentTo) >= Date.parse(currentFrom) &&
    Date.parse(currentTo) - Date.parse(currentFrom) ===
      Date.parse(previousTo) - Date.parse(previousFrom),
  );
  const dataTimestamp =
    data.freshness.data_through || data.freshness.generated_at;
  const isStale = checkedAt - Date.parse(dataTimestamp) > 24 * 60 * 60 * 1000;
  const comparisonRange =
    kpis.revenue.previous_period_from && previousEnd
      ? `${formatTashkentDate(kpis.revenue.previous_period_from, locale)} — ${formatTashkentDate(previousEnd, locale)}`
      : t('dashboard.v2.previous_period', 'Oldingi davr');
  const trendExclusiveEnd = kpis.revenue.period_to || data.filters.to;
  const trendPeriodTo =
    kpis.revenue.period_to_inclusive ||
    (trendExclusiveEnd.length === 10
      ? trendExclusiveEnd
      : new Date(new Date(trendExclusiveEnd).getTime() - 1).toISOString());
  const trendStart = uzDateParts(data.filters.from);
  const trendEnd = uzDateParts(trendPeriodTo);
  const trendRange =
    locale.startsWith('uz') &&
    trendStart.month === trendEnd.month &&
    trendStart.year === trendEnd.year
      ? `${trendStart.day} — ${trendEnd.day} ${trendEnd.month} ${trendEnd.year}`
      : `${formatTashkentDate(data.filters.from, locale)} — ${formatTashkentDate(trendPeriodTo, locale)}`;
  const trendRangeCaption = `${trendRange} · ${t(data.filters.granularity === 'week' ? 'dashboard.v2.weekly' : 'dashboard.v2.daily').toUpperCase()}`;
  const debtAgingTotal = Object.values(kpis.debt_aging).reduce(
    (sum, value) => sum + value,
    0,
  );
  const debtAgingBuckets = [
    {
      key: 'bucket_0_30',
      label: t('dashboard.v2.financial_block.bucket_0_30', '0–30 kun'),
      value: kpis.debt_aging.bucket_0_30,
      barClassName: 'bg-info',
    },
    {
      key: 'bucket_31_60',
      label: t('dashboard.v2.financial_block.bucket_31_60', '31–60 kun'),
      value: kpis.debt_aging.bucket_31_60,
      barClassName: 'bg-primary',
    },
    {
      key: 'bucket_61_90',
      label: t('dashboard.v2.financial_block.bucket_61_90', '61–90 kun'),
      value: kpis.debt_aging.bucket_61_90,
      barClassName: 'bg-warning',
    },
    {
      key: 'bucket_90_plus',
      label: t('dashboard.v2.financial_block.bucket_90_plus', '90+ kun'),
      value: kpis.debt_aging.bucket_90_plus,
      barClassName: 'bg-destructive',
    },
  ] as const;
  const detailViews: Array<{
    key: typeof detailView;
    label: string;
    buttonLabel: string;
    description: string;
    icon: typeof Wallet;
  }> = [
    {
      key: 'financial',
      label: t('dashboard.v2.financial_block.title', 'Moliya va qarzdorlik'),
      buttonLabel: t(
        'dashboard.v2.analysis_financial',
        'Tushum va talaba qarzdorligi',
      ),
      description: t(
        'dashboard.v2.financial_block.subtitle',
        'Qarz muddati, tushum sifati va kurslar kesimi.',
      ),
      icon: Wallet,
    },
    {
      key: 'academic',
      label: t('dashboard.v2.academic_block.title', 'O‘quv jarayoni'),
      buttonLabel: t('dashboard.v2.analysis_academic', 'O‘quv'),
      description: t(
        'dashboard.v2.academic_block.subtitle',
        'Davomat, imtihon va bitirish holati.',
      ),
      icon: GraduationCap,
    },
    {
      key: 'staff',
      label: t('dashboard.v2.staff_block.title', 'Jamoa samaradorligi'),
      buttonLabel: t('dashboard.v2.analysis_staff', 'Jamoa'),
      description: t(
        'dashboard.v2.staff_block.subtitle',
        'O‘qituvchi yuklamasi va ishlarning o‘z vaqtida bajarilishi.',
      ),
      icon: UsersThree,
    },
    {
      key: 'operations',
      label: t('operations.title', 'Instruktorlar va Avtopark Nazorati'),
      buttonLabel: t('operations.tab_operations', 'Operatsion Radar'),
      description: t(
        'operations.subtitle',
        'Filiallar kesimida amaliyot soatlari, toliqish xavfi va yoqilg‘i sarfi me’yorlari monitoringi.',
      ),
      icon: GasPump,
    },
  ];
  const activeDetailView =
    detailViews.find((view) => view.key === detailView) ?? detailViews[0];
  return (
    <div className="space-y-4 pb-8">
      <DashboardChrome
        data={data}
        user={user}
        canViewAllBranches={canViewAllBranches}
        branches={branches}
        params={params}
        updateParam={updateParam}
        refetch={refetch}
        isFetching={isFetching}
      />

      {isOwner && isStale && (
        <Card
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-border bg-warning/10 p-4 text-warning"
        >
          <Warning className="h-5 w-5 shrink-0" aria-hidden="true" />
          <p>
            {t(
              'dashboard.v2.stale_data',
              'Maʼlumotlar sanasi 24 soatdan eski. Yangilash tugmasini bosing.',
            )}
          </p>
        </Card>
      )}
      {!isOwner && showFinanceSummary && (
        <FinanceSummarySection query={financeQuery} />
      )}
      <div
        data-testid="dashboard-v2-kpi-strip"
        className="grid gap-3 sm:grid-cols-3"
        aria-label={t(
          'dashboard.v2.kpi_section_label',
          'Asosiy ko‘rsatkichlar',
        )}
      >
        <StatCard
          onClick={() =>
            navigate({
              to: '/payments',
              search: {
                ...listSearch,
                date_from: todayInUz(),
                date_to: todayInUz(),
              },
            })
          }
          label={t('dashboard.v2.today_revenue', 'Bugungi tushum')}
          value={formatMoney(kpis.revenue.today)}
        />
        <StatCard
          onClick={() => {
            if (isOwner) {
              const queue = document.getElementById('dashboard-recovery');
              queue?.scrollIntoView?.({
                behavior: 'smooth',
                block: 'start',
              });
              queue?.focus({ preventScroll: true });
            } else {
              void navigate({
                to: '/students',
                search: { ...listSearch, status: 'active', has_debt: true },
              });
            }
          }}
          label={t('dashboard.v2.outstanding_debt', 'Jami qarzdorlik')}
          value={
            <span className="text-destructive">
              {formatMoney(kpis.debt.current_outstanding)}
            </span>
          }
          meta={t('dashboard.v2.debtors', '{{count}} ta qarzdor student', {
            count: kpis.debt.students_with_debt,
          })}
        />
        <StatCard
          onClick={() =>
            navigate({
              to: '/students',
              search: { ...listSearch, status: 'active' },
            })
          }
          label={t('dashboard.hero_active_students')}
          value={groupDigits(String(Math.round(kpis.students.active)))}
          meta={
            <span>
              +{kpis.students.new}{' '}
              {t('dashboard.v2.new_in_period', 'tanlangan davrda')}
            </span>
          }
        />
        {!isOwner && (
          <>
            {/* Other roles retain their KPI strip. */}
            <StatCard
              label={<>{t('dashboard.v2.period_revenue', 'Davr tushumi')}</>}
              value={<>{formatMoney(kpis.revenue.period)}</>}
            />
            <StatCard
              label={t('dashboard.v2.period_over_period', 'Davr o‘sishi')}
              value={
                canCompareRevenue && kpis.revenue.delta_percent != null ? (
                  <DeltaChip delta={kpis.revenue.delta_percent} />
                ) : (
                  '—'
                )
              }
              meta={comparisonRange}
            />
            <StatCard
              label={
                <>
                  {t('dashboard.v2.academic_block.attendance_rate', 'Davomat')}
                </>
              }
              value={
                <>
                  {kpis.attendance_rate != null
                    ? `${kpis.attendance_rate}%`
                    : '—'}
                </>
              }
            />
          </>
        )}
      </div>
      <section
        id="dashboard-recovery"
        tabIndex={-1}
        aria-label={t('dashboard.v2.recovery', 'Qarzdorlik navbati')}
        className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Card
          heading={t('dashboard.v2.recovery', 'Qarzdorlik navbati')}
          description={t(
            'dashboard.v2.recovery_subtitle',
            'Eng katta qarzlar birinchi ko‘rsatiladi.',
          )}
          action={
            <span
              data-testid="recovery-count"
              className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md border border-border bg-destructive/10 px-2.5 text-xs font-semibold text-destructive"
            >
              <span className="font-mono tabular-nums">
                {kpis.debt.students_with_debt}
              </span>{' '}
              {t('dashboard.v2.debtors_label', 'qarzdor')}
            </span>
          }
        >
          {visibleRecoveryQueue.length ? (
            <ul>
              {visibleRecoveryQueue.map((student) => {
                const overdueDays = daysSince(student.last_payment_at);
                const tone = debtPriorityTone(student.debt, overdueDays);
                return (
                  <li
                    key={student.student_id}
                    className="border-b border-border last:border-b-0"
                  >
                    <Link
                      to="/students/$id"
                      params={{ id: student.student_id }}
                      aria-label={t(
                        'dashboard.v2.view_debtor',
                        "Ko'rish: {{name}}",
                        { name: student.student_name },
                      )}
                      className="-mx-2 flex cursor-pointer items-center justify-between gap-4 rounded-md px-2 py-3 transition-colors hover:bg-muted/70 active:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">
                          {student.student_name}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {student.branch_name}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: DEBT_TONE_VAR[tone] }}
                          aria-hidden="true"
                        />
                        <span className="font-heading text-base font-bold tabular-nums text-destructive">
                          {formatMoney(student.debt)}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyData />
          )}
          {data.recovery_queue.length > 0 &&
            (canReadDebtors && debtorScopeMatches ? (
              <Link
                to="/students"
                search={{
                  branch_id: query.branchId,
                  course_type: query.courseType,
                  status: 'active',
                  has_debt: true,
                }}
                className="mt-3 inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-md px-2 text-sm font-medium text-info transition-[background-color,scale] hover:bg-info/10 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-10"
              >
                {t('dashboard.v2.view_all_debtors', 'Barcha qarzdorlar')}
                <CaretRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            ) : (
              <p className="mt-3 px-2 text-sm text-muted-foreground">
                {t(
                  canReadDebtors
                    ? 'dashboard.v2.debtors_scope_mismatch'
                    : 'dashboard.v2.debtors_access_unavailable',
                )}
              </p>
            ))}
        </Card>
        <Card
          heading={t('dashboard.v2.operations', 'Bugungi vazifalar')}
          description={t(
            'dashboard.v2.operations_subtitle',
            'Dars jadvali va davomat bo‘yicha bajariladigan ishlar.',
          )}
        >
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <Link
              to="/schedule"
              className="group flex min-h-16 cursor-pointer items-center justify-between rounded-md bg-muted/40 p-3 motion-safe:transition-[background-color,border-color,scale] duration-150 hover:border-border hover:bg-muted/60 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex items-center gap-3">
                <CalendarDot
                  className="h-5 w-5 text-warning-strong"
                  aria-hidden="true"
                />
                <span>
                  <span className="block text-sm font-semibold">
                    {t('nav.schedule', 'Kelasi darslar')}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {data.operations.next_lessons.length} ta rejalashtirilgan
                  </span>
                </span>
              </span>
              <CaretRight
                className="h-4 w-4 text-muted-foreground motion-safe:transition-transform duration-150 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
            <Link
              to="/attendance"
              className="group flex min-h-16 cursor-pointer items-center justify-between rounded-md bg-muted/40 p-3 motion-safe:transition-[background-color,border-color,scale] duration-150 hover:border-border hover:bg-muted/60 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-warning" aria-hidden="true" />
                <span>
                  <span className="block text-sm font-semibold">
                    {t('nav.attendance', 'Davomat tekshiruvi')}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {data.operations.incomplete_attendance_lessons.length} ta
                    dars kutilmoqda
                  </span>
                </span>
              </span>
              <CaretRight
                className="h-4 w-4 text-muted-foreground motion-safe:transition-transform duration-150 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {Object.entries(data.operations.attendance_status).map(
              ([status, count]) => (
                <span
                  key={status}
                  className="rounded-md border border-border bg-muted/30 px-2.5 py-1"
                >
                  <span className="font-semibold text-foreground tabular-nums">
                    {count}
                  </span>{' '}
                  {t(`attendance.status_${status}`, status)}
                </span>
              ),
            )}
            {attendanceTotal === 0 && (
              <span>
                {t('dashboard.v2.attendance_no_data', 'Davomat maʼlumoti yo‘q')}
              </span>
            )}
          </div>
        </Card>
      </section>

      <Card asChild edgeToEdge>
        <section className="overflow-hidden ">
          <div className="border-t border-border p-4 sm:p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold tracking-tight text-balance">
                  {t('dashboard.v2.revenue_trend', 'Tushum trendi')}
                </h2>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  {trendRangeCaption}
                </p>
              </div>
              <Link
                to="/payments"
                search={listSearch}
                className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-md px-2 text-sm font-medium text-info transition-[background-color,scale] duration-150 ease-out hover:bg-info/10 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-10"
              >
                {t('payments.detail_details', 'Detallar')}
                <CaretRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
            {data.revenue_trend.length ? (
              <Suspense
                fallback={
                  <div role="status" aria-live="polite" aria-busy="true">
                    <span className="sr-only">{t('common.loading')}</span>
                    <Skeleton className="h-[22rem] w-full rounded-md" />
                  </div>
                }
              >
                <RevenueTrendChart data={data.revenue_trend} />
              </Suspense>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t(
                  'dashboard.v2.no_period_data',
                  'Tanlangan davr uchun maʼlumot yo‘q',
                )}
              </p>
            )}
          </div>
        </section>
      </Card>
      <Collapsible open={!isOwner || detailsOpen} onOpenChange={setDetailsOpen}>
        {isOwner && (
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="mb-4">
              {t('dashboard.v2.analysis_title', 'Batafsil')}
            </Button>
          </CollapsibleTrigger>
        )}
        <CollapsibleContent className="space-y-4">
          {isOwner && (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <StatCard
                  label={
                    <>{t('dashboard.v2.period_revenue', 'Davr tushumi')}</>
                  }
                  value={<>{formatMoney(kpis.revenue.period)}</>}
                />
                <StatCard
                  label={
                    <>{t('dashboard.v2.period_over_period', 'Davr o‘sishi')}</>
                  }
                  value={
                    <>
                      {canCompareRevenue &&
                      kpis.revenue.delta_percent != null ? (
                        <DeltaChip delta={kpis.revenue.delta_percent} />
                      ) : (
                        <span className="font-heading text-xl font-bold">
                          —
                        </span>
                      )}
                    </>
                  }
                  meta={<>{comparisonRange}</>}
                />
                <StatCard
                  label={t(
                    'dashboard.v2.academic_block.attendance_rate',
                    'Davomat',
                  )}
                  value={
                    kpis.attendance_rate != null
                      ? `${kpis.attendance_rate}%`
                      : '—'
                  }
                />
              </div>
              {showFinanceSummary && (
                <FinanceSummarySection query={financeQuery} />
              )}
            </>
          )}
          <section className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
            <Card
              hidden={!canViewAllBranches}
              heading={t(
                'dashboard.v2.branch_performance',
                'Filial performance',
              )}
              description={t(
                'dashboard.v2.branch_subtitle',
                'Tanlangan davr tushumi va joriy qarzdorlik.',
              )}
              action={
                <div className="flex max-w-full flex-wrap items-center justify-end gap-1.5">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {t('dashboard.v2.sort_by', 'Saralash')}
                  </span>
                  <div
                    role="group"
                    aria-label={t('dashboard.v2.sort_by', 'Saralash')}
                    className="flex max-w-full flex-wrap gap-1"
                  >
                    {(
                      [
                        [
                          'revenue',
                          t('dashboard.top_branches_revenue', 'Tushum'),
                        ],
                        [
                          'active_students',
                          t('dashboard.v2.active_short', 'Faol'),
                        ],
                        [
                          'outstanding_debt',
                          t('dashboard.cards.total_debt', 'Qarz'),
                        ],
                        [
                          'collection_rate',
                          t('dashboard.v2.coverage_short', 'To‘liq'),
                        ],
                      ] as const
                    ).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setBranchSort(key)}
                        aria-pressed={branchSort === key}
                        className={cn(
                          'min-h-10 cursor-pointer rounded-md border px-2.5 py-1 text-[11px] font-semibold motion-safe:transition-[background-color,border-color,color,scale] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3 sm:text-xs',
                          branchSort === key
                            ? 'border-border bg-accent text-accent-foreground'
                            : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <Link
                    to="/branches"
                    className="inline-flex min-h-11 cursor-pointer items-center rounded-md px-2 text-sm font-medium text-info transition-[background-color,scale] hover:bg-info/10 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-10"
                  >
                    {t('dashboard.v2.manage_branches', 'Filiallar')}{' '}
                    <CaretRight
                      className="ml-1 inline h-3 w-3"
                      aria-hidden="true"
                    />
                  </Link>
                </div>
              }
            >
              {sortedBranches.length ? (
                <>
                  <div className="space-y-2 sm:hidden">
                    {sortedBranches.map((branch) => (
                      <button
                        key={branch.id}
                        type="button"
                        onClick={() =>
                          navigate({
                            to: '/branches/$id',
                            params: { id: branch.id },
                          })
                        }
                        className="w-full rounded-md bg-muted/40 p-3 text-left motion-safe:transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold">{branch.name}</span>
                          <CaretRight
                            className="h-4 w-4 text-muted-foreground"
                            aria-hidden="true"
                          />
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <span>
                            {t('dashboard.top_branches_revenue', 'Tushum')}{' '}
                            <strong className="block text-foreground tabular-nums">
                              {formatMoney(branch.collected_revenue)}
                            </strong>
                          </span>
                          <span>
                            {t('dashboard.cards.total_debt', 'Qarz')}{' '}
                            <strong className="block text-warning tabular-nums">
                              {formatMoney(branch.outstanding_debt)}
                            </strong>
                          </span>
                          <span>
                            {t(
                              'dashboard.top_branches_students',
                              'Faol talabalar',
                            )}{' '}
                            <strong className="block text-foreground tabular-nums">
                              {branch.active_students}
                            </strong>
                          </span>
                          <span>
                            {t('dashboard.v2.coverage', 'To‘liq to‘laganlar')}{' '}
                            <strong className="block text-foreground tabular-nums">
                              {branch.collection_rate}%
                            </strong>
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="hidden overflow-x-auto sm:block">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                          <th className="py-2">
                            {t('dashboard.top_branches_branch', 'Filial')}
                          </th>
                          <th className="py-2 text-right">
                            {t('dashboard.top_branches_revenue', 'Tushum')}
                          </th>
                          <th className="py-2 text-right">
                            {t('dashboard.v2.active_short', 'Faol')}
                          </th>
                          <th className="py-2 text-right">
                            {t('dashboard.cards.total_debt', 'Qarz')}
                          </th>
                          <th className="py-2 text-right">
                            {t('dashboard.v2.coverage_short', 'To‘liq')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedBranches.map((branch) => (
                          <tr
                            key={branch.id}
                            tabIndex={0}
                            role="button"
                            onClick={() =>
                              navigate({
                                to: '/branches/$id',
                                params: { id: branch.id },
                              })
                            }
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                void navigate({
                                  to: '/branches/$id',
                                  params: { id: branch.id },
                                });
                              }
                            }}
                            className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <td className="py-3 font-medium">{branch.name}</td>
                            <td className="py-3 text-right font-semibold tabular-nums">
                              {formatMoney(branch.collected_revenue)}
                            </td>
                            <td className="py-3 text-right tabular-nums">
                              {branch.active_students}
                            </td>
                            <td className="py-3 text-right tabular-nums text-warning">
                              {formatMoney(branch.outstanding_debt)}
                            </td>
                            <td className="py-3">
                              <div className="flex items-center justify-end gap-2">
                                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${Math.min(branch.collection_rate, 100)}%`,
                                      backgroundColor:
                                        branch.collection_rate >= 85
                                          ? 'hsl(var(--chart-success))'
                                          : 'hsl(var(--chart-warning))',
                                    }}
                                  />
                                </div>
                                <span className="font-mono text-xs tabular-nums">
                                  {branch.collection_rate}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <EmptyData />
              )}
            </Card>
            <Card
              className={!canViewAllBranches ? 'lg:col-span-2' : undefined}
              heading={t('dashboard.v2.collection_status', 'To‘lov holati')}
              description={t(
                'dashboard.v2.collection_subtitle',
                'Faol talabalar bo‘yicha joriy to‘lov holati.',
              )}
            >
              {statusTotal ? (
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-around">
                  <PaymentStatusDonut
                    paid={kpis.collection.paid}
                    partial={kpis.collection.partial}
                    debt={kpis.collection.debt}
                    coverageRate={kpis.collection.coverage_rate}
                  />
                  <div className="w-full max-w-[220px] space-y-2.5">
                    <LegendRow
                      color="hsl(var(--chart-success))"
                      label={t('dashboard.payment_full', "To'liq to'lagan")}
                      value={kpis.collection.paid}
                    />
                    <LegendRow
                      color="hsl(var(--chart-warning))"
                      label={t('dashboard.payment_partial', 'Qisman')}
                      value={kpis.collection.partial}
                    />
                    <LegendRow
                      color="hsl(var(--chart-danger))"
                      label={t('dashboard.payment_none', "To'lamagan")}
                      value={kpis.collection.debt}
                    />
                  </div>
                </div>
              ) : (
                <EmptyData />
              )}
            </Card>
          </section>

          <section aria-labelledby="dashboard-detail-title">
            <div className="space-y-4">
              <div className="flex flex-col gap-4 border-b border-border p-4 sm:p-5 2xl:flex-row 2xl:items-end 2xl:justify-between">
                <div className="min-w-0">
                  <h2
                    id="dashboard-detail-title"
                    className="text-lg font-semibold tracking-tight"
                  >
                    {t('dashboard.v2.analysis_title', 'Batafsil tahlil')}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t(
                      'dashboard.v2.analysis_subtitle',
                      'Yo‘nalishni tanlab, natija ortidagi sabablarni ko‘ring.',
                    )}
                  </p>
                </div>
                <div
                  role="group"
                  aria-label={t(
                    'dashboard.v2.analysis_tabs_label',
                    'Tahlil yo‘nalishi',
                  )}
                  className="grid w-full min-w-0 grid-cols-2 gap-1 rounded-lg border border-border bg-muted/50 p-1 sm:grid-cols-4 2xl:w-auto"
                >
                  {detailViews.map((view) => (
                    <button
                      key={view.key}
                      type="button"
                      aria-label={view.label}
                      aria-pressed={detailView === view.key}
                      onClick={() => setDetailView(view.key)}
                      className={cn(
                        'flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border px-2.5 text-xs font-semibold transition-[background-color,border-color,color,box-shadow,scale] duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm',
                        detailView === view.key
                          ? 'border-border bg-accent text-accent-foreground'
                          : 'border-transparent text-muted-foreground hover:border-border hover:bg-card hover:text-foreground',
                      )}
                    >
                      <view.icon
                        className="h-4 w-4 shrink-0"
                        aria-hidden="true"
                      />
                      <span className="min-w-0 whitespace-normal">
                        {view.buttonLabel}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div
                role="region"
                aria-label={activeDetailView.label}
                className="p-4 sm:p-5"
              >
                <div className="mb-4">
                  <h3 className="text-base font-bold">
                    {activeDetailView.label}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {activeDetailView.description}
                  </p>
                </div>

                {detailView === 'financial' && (
                  <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
                    <div className="rounded-md bg-muted/40 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-sm font-bold">
                            {t(
                              'dashboard.v2.financial_block.debt_age_title',
                              'Qarz muddati',
                            )}
                          </h4>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t(
                              'dashboard.v2.financial_block.debt_age_description',
                              'So‘nggi to‘lovdan beri o‘tgan vaqt bo‘yicha.',
                            )}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            {t(
                              'dashboard.v2.outstanding_debt',
                              'Jami qarzdorlik',
                            )}
                          </p>
                          <p className="mt-1 font-mono text-sm font-bold tabular-nums">
                            {formatMoney(debtAgingTotal)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 divide-y divide-border/70">
                        {debtAgingBuckets.map((bucket) => {
                          const share = debtAgingTotal
                            ? Math.round(
                                (bucket.value / debtAgingTotal) * 1000,
                              ) / 10
                            : 0;
                          return (
                            <div
                              key={bucket.key}
                              className="grid grid-cols-[64px_minmax(72px,1fr)_auto] items-center gap-3 py-2.5"
                            >
                              <span className="text-xs font-semibold">
                                {bucket.label}
                              </span>
                              <div className="flex items-center gap-2">
                                <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                                  <div
                                    className={cn(
                                      'h-full rounded-full',
                                      bucket.barClassName,
                                    )}
                                    style={{ width: `${share}%` }}
                                  />
                                </div>
                                <span className="w-10 text-right font-mono text-[10px] tabular-nums text-muted-foreground">
                                  {share}%
                                </span>
                              </div>
                              <span className="font-mono text-xs font-bold tabular-nums sm:text-sm">
                                {formatMoney(bucket.value)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <p className="mt-3 border-t border-border/70 pt-3 text-[11px] leading-relaxed text-muted-foreground">
                        {t(
                          'dashboard.v2.financial_block.debt_age_source',
                          'To‘lov bo‘lmagan talabada muddat ro‘yxatdan o‘tgan kundan hisoblanadi.',
                        )}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                      <StatCard
                        label={t(
                          'dashboard.v2.financial_block.arpu',
                          'Faol talaba boshiga tushum',
                        )}
                        value={formatMoney(kpis.arpu)}
                        meta={t(
                          'dashboard.v2.financial_block.arpu_meta',
                          'Tanlangan davr tushumi ÷ faol talabalar',
                        )}
                        icon={<UsersThree className="h-4 w-4" />}
                        tone="primary"
                      />
                      <StatCard
                        label={t(
                          'dashboard.v2.financial_block.cash_collection',
                          'To‘lov undirish darajasi',
                        )}
                        value={`${kpis.cash_collection_rate}%`}
                        meta={t(
                          'dashboard.v2.financial_block.cash_collection_meta',
                          'Faol talabalar shartnoma summasining to‘langan qismi',
                        )}
                        icon={<PiggyBank className="h-4 w-4" />}
                        tone={
                          kpis.cash_collection_rate >= 80
                            ? 'success'
                            : 'warning'
                        }
                      />
                      <div className="rounded-md bg-muted/40 p-4 sm:col-span-2 xl:col-span-1">
                        <h4 className="text-sm font-bold">
                          {t(
                            'dashboard.v2.financial_block.course_revenue',
                            'Kurslar bo‘yicha tushum',
                          )}
                        </h4>
                        <div className="mt-2 divide-y divide-border/70">
                          {(['tezkor', 'avto_maktab'] as const).map(
                            (courseType) => {
                              const entry =
                                kpis.revenue_by_course_type[courseType];
                              return (
                                <div
                                  key={courseType}
                                  className="flex items-center justify-between gap-4 py-2.5"
                                >
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold">
                                      {t(
                                        `students.course.${courseType}`,
                                        courseType,
                                      )}
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                                      {entry.per_lesson !== null
                                        ? t(
                                            'dashboard.v2.financial_block.per_lesson',
                                            '{{value}} har bir darsga',
                                            {
                                              value: formatMoney(
                                                Math.round(entry.per_lesson),
                                              ),
                                            },
                                          )
                                        : t(
                                            'dashboard.v2.financial_block.no_lessons',
                                            'Dars maʼlumoti yo‘q',
                                          )}
                                    </p>
                                  </div>
                                  <p className="shrink-0 font-mono text-sm font-bold tabular-nums">
                                    {formatMoney(entry.revenue)}
                                  </p>
                                </div>
                              );
                            },
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {detailView === 'academic' && (
                  <>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <StatCard
                        label={t(
                          'dashboard.v2.academic_block.attendance_rate',
                          'Davomat',
                        )}
                        value={
                          kpis.attendance_rate != null
                            ? `${kpis.attendance_rate}%`
                            : '—'
                        }
                        meta={t(
                          'dashboard.v2.academic_block.attendance_meta',
                          'Tanlangan davrdagi darslar bo‘yicha',
                        )}
                        icon={<CheckCircle className="h-4 w-4" />}
                        tone={
                          kpis.attendance_rate == null
                            ? 'info'
                            : kpis.attendance_rate >= 90
                              ? 'success'
                              : kpis.attendance_rate >= 75
                                ? 'warning'
                                : 'info'
                        }
                      />
                      <StatCard
                        label={t(
                          'dashboard.v2.academic_block.dropout_rate',
                          'O‘qishni to‘xtatganlar ulushi',
                        )}
                        value={
                          kpis.dropout_rate != null
                            ? `${kpis.dropout_rate}%`
                            : '—'
                        }
                        meta={t(
                          'dashboard.v2.academic_block.suspended_meta',
                          '{{count}} talaba alohida e’tibor talab qiladi',
                          { count: kpis.students.suspended ?? 0 },
                        )}
                        icon={<UserMinus className="h-4 w-4" />}
                        tone={
                          (kpis.dropout_rate ?? 0) > 15 ? 'warning' : 'info'
                        }
                      />
                      <StatCard
                        label={t(
                          'dashboard.v2.academic_block.exam_pass_rate',
                          'Birinchi urinishda topshirganlar',
                        )}
                        value={
                          kpis.exam_first_attempt_pass_rate != null
                            ? `${kpis.exam_first_attempt_pass_rate}%`
                            : '—'
                        }
                        meta={t(
                          'dashboard.v2.academic_block.exam_pass_meta',
                          'Birinchi imtihon natijasi bo‘yicha',
                        )}
                        icon={<ClipboardText className="h-4 w-4" />}
                        tone="info"
                      />
                      <StatCard
                        label={t(
                          'dashboard.v2.academic_block.completion_time',
                          'Bitirish muddati medianasi',
                        )}
                        value={
                          kpis.completion_time_median_days != null
                            ? t(
                                'dashboard.v2.academic_block.days_value',
                                '{{count}} kun',
                                { count: kpis.completion_time_median_days },
                              )
                            : '—'
                        }
                        meta={t(
                          'dashboard.v2.academic_block.completion_meta',
                          'Bitirganlarning yarmi bundan tezroq yakunlagan',
                        )}
                        icon={<Hourglass className="h-4 w-4" />}
                        tone="primary"
                      />
                    </div>
                    {kpis.enrollment_funnel && (
                      <div className="mt-4 space-y-3 rounded-md bg-muted/40 p-4">
                        <p className="text-xs font-bold">
                          {t(
                            'dashboard.v2.academic_block.funnel_title',
                            'Ro‘yxatdan bitirishgacha',
                          )}
                        </p>
                        {(
                          [
                            [
                              'contract',
                              t(
                                'dashboard.v2.academic_block.funnel_contract',
                                'Shartnoma',
                              ),
                              kpis.enrollment_funnel.contract,
                              'bg-primary',
                            ],
                            [
                              'active',
                              t(
                                'dashboard.v2.academic_block.funnel_active',
                                'Faol',
                              ),
                              kpis.enrollment_funnel.active,
                              'bg-info',
                            ],
                            [
                              'graduated',
                              t(
                                'dashboard.v2.academic_block.funnel_graduated',
                                'Bitirgan',
                              ),
                              kpis.enrollment_funnel.graduated,
                              'bg-success',
                            ],
                          ] as const
                        ).map(([key, label, value, barClassName]) => (
                          <div key={key} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                {label}
                              </span>
                              <span className="font-semibold tabular-nums">
                                {value}
                              </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-muted">
                              <div
                                className={cn('h-full', barClassName)}
                                style={{
                                  width: `${
                                    kpis.enrollment_funnel!.contract
                                      ? (value /
                                          kpis.enrollment_funnel!.contract) *
                                        100
                                      : 0
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                        <p className="pt-1 text-xs text-muted-foreground">
                          {t(
                            'dashboard.v2.academic_block.funnel_dropped',
                            'O‘qishni to‘xtatgan yoki vaqtincha chetlatilgan',
                          )}
                          :{' '}
                          <span className="font-semibold text-foreground tabular-nums">
                            {kpis.enrollment_funnel.dropped_or_suspended}
                          </span>
                        </p>
                      </div>
                    )}
                  </>
                )}

                {detailView === 'operations' && (
                  <Suspense
                    fallback={
                      <div
                        role="status"
                        aria-live="polite"
                        aria-busy="true"
                        className="space-y-4 pt-2"
                      >
                        <span className="sr-only">{t('common.loading')}</span>
                        <Skeleton className="h-32 w-full rounded-lg" />
                        <Skeleton className="h-64 w-full rounded-lg" />
                      </div>
                    }
                  >
                    <FleetWorkloadOperationsCenter />
                  </Suspense>
                )}

                {detailView === 'staff' && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <StatCard
                      label={t(
                        'dashboard.v2.staff_block.teacher_load_label',
                        'O‘qituvchi yuklamasi',
                      )}
                      value={
                        kpis.teacher_load?.avg_lessons_per_active_teacher !=
                        null
                          ? `${kpis.teacher_load.avg_lessons_per_active_teacher} ${t('dashboard.v2.staff_block.teacher_load_unit', 'dars/o‘qituvchi')}`
                          : t(
                              'dashboard.v2.staff_block.no_data',
                              'Maʼlumot yo‘q',
                            )
                      }
                      meta={t(
                        'dashboard.v2.staff_block.teacher_load_meta',
                        '{{teachers}} faol o‘qituvchi · har biriga {{students}} talaba',
                        {
                          teachers:
                            kpis.teacher_load?.active_teacher_count ?? 0,
                          students:
                            kpis.teacher_load?.avg_students_per_teacher ?? 0,
                        },
                      )}
                      icon={<GraduationCap className="h-4 w-4" />}
                      tone="primary"
                      onClick={() => navigate({ to: '/teachers' })}
                    />
                    <StatCard
                      label={t(
                        'dashboard.v2.staff_block.on_time_attendance_label',
                        'Davomatni dars kunida belgilash',
                      )}
                      value={
                        kpis.on_time_attendance_marking_rate != null
                          ? `${kpis.on_time_attendance_marking_rate}%`
                          : t(
                              'dashboard.v2.staff_block.no_data',
                              'Maʼlumot yo‘q',
                            )
                      }
                      meta={t(
                        'dashboard.v2.staff_block.on_time_attendance_meta',
                        'Dars o‘tgan kunning o‘zida kiritilgan davomatlar',
                      )}
                      icon={<Clock className="h-4 w-4" />}
                      tone={
                        (kpis.on_time_attendance_marking_rate ?? 0) >= 80
                          ? 'success'
                          : 'warning'
                      }
                      onClick={() => navigate({ to: '/attendance' })}
                    />
                    <StatCard
                      label={t(
                        'dashboard.v2.staff_block.operator_follow_through_label',
                        'Ro‘yxatdan to‘lovgacha',
                      )}
                      value={
                        kpis.avg_operator_payment_follow_through_rate != null
                          ? `${kpis.avg_operator_payment_follow_through_rate}%`
                          : t(
                              'dashboard.v2.staff_block.no_data',
                              'Maʼlumot yo‘q',
                            )
                      }
                      meta={t(
                        'dashboard.v2.staff_block.operator_follow_through_meta',
                        'Operator ro‘yxatdan o‘tkazganlar ichida to‘lov qilganlar',
                      )}
                      icon={<UserCheck className="h-4 w-4" />}
                      tone="info"
                      onClick={() => navigate({ to: '/operators' })}
                    />
                  </div>
                )}
              </div>
            </div>
          </section>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

const DashboardSkeleton = () => (
  <div className="space-y-4" aria-hidden="true">
    <div className="grid gap-3 sm:grid-cols-3">
      {[0, 1, 2].map((index) => (
        <Card key={index} className="min-h-24 space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-3 w-24" />
        </Card>
      ))}
    </div>
    <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
      {[0, 1].map((index) => (
        <Card key={index} className="space-y-4 ">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56 max-w-full" />
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} className="h-20 w-full rounded-md" />
          ))}
        </Card>
      ))}
    </div>
  </div>
);

const ErrorState = ({ onRetry }: { onRetry: () => void }) => {
  const { t } = useTranslation();
  return (
    <Card role="alert" className="border-border bg-destructive/5  text-center">
      <Warning className="mx-auto h-8 w-8 text-destructive" />
      <h1 className="mt-3 text-lg font-semibold">
        {t(
          'dashboard.v2.error_title',
          "Dashboard maʼlumotlarini yuklab bo'lmadi",
        )}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t(
          'dashboard.v2.error_subtitle',
          "Ulanishni tekshiring va qayta urinib ko'ring.",
        )}
      </p>
      <Button className="mt-4" onClick={onRetry}>
        {t('common.retry', 'Qayta urinish')}
      </Button>
    </Card>
  );
};

export default CompanyRevenueDashboard;
