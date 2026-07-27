import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "../../theme/themeContext";
import { MONTH_LABELS, compactUzs, fullUzs, getChartColors } from "./chartTheme";

/**
 * "Daromad statistikasi" — yil davomida oylik to'langan summa.
 * months: [{ month: 1..12, paid, pending, debt, expected }]
 */
export default function RevenueLineChart({ months = [], height = 260 }) {
  const { darkMode, theme } = useTheme();
  const colors = getChartColors(darkMode);

  const data = months.map((item) => ({
    label: MONTH_LABELS[(item.month || 1) - 1] || "",
    paid: Number(item.paid || 0),
  }));

  if (!data.length) {
    return (
      <div
        className={`flex items-center justify-center text-sm ${theme.soft}`}
        style={{ height }}
      >
        Ma'lumot yo'q
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.accent} stopOpacity={0.35} />
            <stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid stroke={colors.grid} vertical={false} />
        <XAxis
          dataKey="label"
          stroke={colors.axis}
          tickLine={false}
          axisLine={false}
          fontSize={12}
        />
        <YAxis
          stroke={colors.axis}
          tickLine={false}
          axisLine={false}
          fontSize={12}
          tickFormatter={compactUzs}
          width={64}
        />
        <Tooltip
          formatter={(value) => [fullUzs(value), "To'langan"]}
          contentStyle={{
            background: colors.tooltipBg,
            border: `1px solid ${colors.tooltipBorder}`,
            borderRadius: 12,
            color: colors.tooltipText,
          }}
          labelStyle={{ color: colors.tooltipText }}
        />
        <Area
          type="monotone"
          dataKey="paid"
          stroke={colors.accent}
          strokeWidth={2}
          fill="url(#revenueFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
