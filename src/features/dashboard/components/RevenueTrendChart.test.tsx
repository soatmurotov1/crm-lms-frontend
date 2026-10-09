import type { ReactNode } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RevenueTrendChart from './RevenueTrendChart';

const state = vi.hoisted(() => ({
  locale: 'uz',
  points: [] as Array<Record<string, unknown>>,
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { resolvedLanguage: state.locale },
  }),
}));
// jsdom has no layout. Capture the real component's Recharts data and invoke
// its actual tooltip content with the first bucket, rather than mock the chart.
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => children,
  ComposedChart: ({
    children,
    data,
  }: {
    children: ReactNode;
    data: typeof state.points;
  }) => {
    state.points = data;
    return <div>{children}</div>;
  },
  Tooltip: ({ content }: { content: (props: unknown) => ReactNode }) => (
    <div data-testid="tooltip">
      {content({ active: true, payload: [{ payload: state.points[0] }] })}
    </div>
  ),
  Area: () => null,
  Bar: () => null,
  CartesianGrid: () => null,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

describe('RevenueTrendChart business dates', () => {
  it.each([
    ['uz', '2026-09-30T19:00:00.000Z', '01.10', '01.10.2026'],
    ['uz', '2026-12-31T19:00:00.000Z', '01.01', '01.01.2027'],
    ['uz', '2024-02-28T19:00:00.000Z', '29.02', '29.02.2024'],
    ['uz', '2026-10-01', '01.10', '01.10.2026'],
    ['ru', '2026-09-30T19:00:00.000Z', '01.10', '1 окт. 2026 г.'],
    ['en', '2026-09-30T19:00:00.000Z', '01.10', 'Oct 1, 2026'],
  ])(
    'keeps axis, tooltip, peak and table aligned for %s %s',
    (locale, start, axis, full) => {
      state.locale = locale;
      const data = [
        { period_start: start, amount: 200000, payment_count: 2 },
        {
          period_start: '2026-10-07T19:00:00.000Z',
          amount: 100000,
          payment_count: 1,
        },
      ];
      render(<RevenueTrendChart data={data} />);
      expect(state.points[0]).toEqual({
        ...data[0],
        label: axis,
        tooltipLabel: full,
      });
      expect(state.points[1]).toMatchObject(data[1]);
      expect(
        within(screen.getByTestId('tooltip')).getByText(full),
      ).toBeInTheDocument();
      expect(screen.getAllByText(full)).toHaveLength(3);
      const rows = within(
        screen.getByRole('table', { hidden: true }),
      ).getAllByRole('row', { hidden: true });
      expect(
        within(rows[1])
          .getAllByRole('cell', { hidden: true })
          .map((cell) => cell.textContent),
      ).toEqual([full, "200 000 so'm", '2']);
      expect(
        within(rows[2]).getAllByRole('cell', { hidden: true })[2],
      ).toHaveTextContent('1');
      expect(screen.getByTestId('chart-metric-revenue')).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    },
  );
});

it('keeps both metric tiles opaque in every pressed state', () => {
  render(<RevenueTrendChart data={[]} />);
  for (const id of ['chart-metric-revenue', 'chart-metric-payments']) {
    const tile = screen.getByTestId(id);
    expect(tile).toHaveAttribute('aria-pressed', 'true');
    expect(tile).toHaveClass('bg-accent', 'text-accent-foreground');
    fireEvent.click(tile);
    expect(tile).toHaveAttribute('aria-pressed', 'false');
    expect(tile).toHaveClass('bg-card', 'text-card-foreground');
    expect(tile.className).not.toMatch(/opacity-|bg-\w+\//);
    fireEvent.click(tile);
  }
});
