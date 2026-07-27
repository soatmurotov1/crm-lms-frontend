import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useTheme } from "../../theme/themeContext";
import { fullUzs, getChartColors } from "./chartTheme";

/**
 * "To'lovlar statistikasi" — joriy oy uchun to'langan / qarzdorlik / kutilmoqda.
 * Ma'lumot mavjud getMonthlySummary endpoint'idan keladi.
 */
export default function PaymentsDonut({
  paid = 0,
  debt = 0,
  pending = 0,
  height = 240,
}) {
  const { darkMode, theme } = useTheme();
  const colors = getChartColors(darkMode);

  const slices = [
    { name: "To'langan", value: Number(paid || 0), color: colors.paid },
    { name: "Qarzdorlik", value: Number(debt || 0), color: colors.debt },
    { name: "Kutilmoqda", value: Number(pending || 0), color: colors.pending },
  ];

  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  if (!total) {
    return (
      <div
        className={`flex items-center justify-center text-sm ${theme.soft}`}
        style={{ height }}
      >
        Bu oy uchun to'lov ma'lumoti yo'q
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div style={{ width: 180, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="90%"
              paddingAngle={2}
              stroke="none"
            >
              {slices.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [fullUzs(value), name]}
              contentStyle={{
                background: colors.tooltipBg,
                border: `1px solid ${colors.tooltipBorder}`,
                borderRadius: 12,
                color: colors.tooltipText,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="flex-1 space-y-3 w-full">
        {slices.map((slice) => {
          const percent = Math.round((slice.value / total) * 100);

          return (
            <li key={slice.name} className="flex items-center gap-3">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: slice.color }}
              />
              <span className={`text-sm flex-1 ${theme.soft}`}>
                {slice.name}
              </span>
              <span className={`text-sm font-semibold ${theme.text}`}>
                {percent}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
