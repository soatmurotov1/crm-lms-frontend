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
import {
  MONTH_LABELS,
  compactUzs,
  fullUzs,
  getChartColors,
  getTooltipStyle,
} from "./chartTheme";

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
            <stop offset="0%" stopColor={colors.accent} stopOpacity={0.16} />
            <stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Faqat gorizontal chiziqlar va ular ham uzuq — to'r ma'lumotni
            o'qishga yordam berishi kerak, u bilan raqobatlashmasligi emas. */}
        <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          stroke={colors.axis}
          tickLine={false}
          axisLine={false}
          fontSize={11}
          dy={4}
        />
        <YAxis
          stroke={colors.axis}
          tickLine={false}
          axisLine={false}
          fontSize={11}
          tickFormatter={compactUzs}
          width={56}
        />
        <Tooltip
          formatter={(value) => [fullUzs(value), "To'langan"]}
          cursor={{ stroke: colors.axis, strokeDasharray: "3 3" }}
          {...getTooltipStyle(colors)}
        />
        <Area
          type="monotone"
          dataKey="paid"
          stroke={colors.accent}
          strokeWidth={2}
          fill="url(#revenueFill)"
          activeDot={{ r: 3.5, strokeWidth: 2, stroke: colors.tooltipBg }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
