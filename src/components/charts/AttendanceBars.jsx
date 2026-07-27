import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "../../theme/themeContext";
import { getChartColors } from "./chartTheme";

/**
 * "Davomat statistikasi" — oxirgi 7 kun, hafta kunlari bo'yicha davomat foizi.
 * days: [{ day: "Dush", percent, present, total }]
 */
export default function AttendanceBars({ days = [], height = 260 }) {
  const { darkMode, theme } = useTheme();
  const colors = getChartColors(darkMode);

  const hasData = days.some((item) => Number(item?.total || 0) > 0);

  if (!hasData) {
    return (
      <div
        className={`flex items-center justify-center text-sm ${theme.soft}`}
        style={{ height }}
      >
        Oxirgi hafta uchun davomat belgilanmagan
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={days} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid stroke={colors.grid} vertical={false} />
        <XAxis
          dataKey="day"
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
          domain={[0, 100]}
          tickFormatter={(value) => `${value}%`}
          width={44}
        />
        <Tooltip
          cursor={{ fill: colors.grid, opacity: 0.4 }}
          formatter={(value, _name, entry) => [
            `${value}% (${entry?.payload?.present || 0}/${entry?.payload?.total || 0})`,
            "Davomat",
          ]}
          contentStyle={{
            background: colors.tooltipBg,
            border: `1px solid ${colors.tooltipBorder}`,
            borderRadius: 12,
            color: colors.tooltipText,
          }}
          labelStyle={{ color: colors.tooltipText }}
        />
        <Bar
          dataKey="percent"
          fill={colors.accent}
          radius={[6, 6, 0, 0]}
          maxBarSize={38}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
