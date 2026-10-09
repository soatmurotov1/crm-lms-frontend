import { nowTashkentParts } from '@/lib/calendarDateTime';

// autodrive-vh0.6: pulled out of DashboardPage.tsx so LegacyMainDashboard
// (still in DashboardPage.tsx) and dashboard/TeacherDashboard.tsx can share
// these without duplication. DashboardPage.tsx imports TeacherDashboard, so
// TeacherDashboard importing these back FROM DashboardPage.tsx would be a
// circular import -- this shared module is the tie-break (same constraint
// CompanyRevenueDashboard.tsx notes for its own local-copy helpers, just
// solved here by extraction instead of duplication since KpiCard/SectionCard
// are too large to safely duplicate-and-drift).

export const formatNumber = (n: number) =>
  new Intl.NumberFormat('uz-UZ').format(Math.round(n || 0));

export const greetingKey = () => {
  const h = Number(nowTashkentParts().time.slice(0, 2));
  if (h < 12) return 'dashboard.greeting_morning';
  if (h < 18) return 'dashboard.greeting_afternoon';
  return 'dashboard.greeting_evening';
};

// ---------- Shared chart styles ----------

export const CHART_STYLE = {
  contentStyle: {
    backgroundColor: 'hsl(var(--popover))',
    border: '1px solid hsl(var(--border))',
    borderRadius: 8,
    color: 'hsl(var(--popover-foreground))',
    fontSize: 12,
  },
  labelStyle: { color: 'hsl(var(--popover-foreground))' },
  itemStyle: { color: 'hsl(var(--popover-foreground))' },
  cursor: { fill: 'hsl(var(--muted))' },
};

export const AXIS_PROPS = {
  stroke: 'hsl(var(--muted-foreground))',
  fontSize: 11,
  fontFamily: 'JetBrains Mono, ui-monospace, monospace',
  tickLine: false,
  axisLine: false,
};
