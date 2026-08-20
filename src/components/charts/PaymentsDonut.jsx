import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useTheme } from "../../theme/themeContext";
import { fullUzs, getChartColors, getTooltipStyle } from "./chartTheme";

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
    /*
      `shrink-0` shart: tor ustunda (masalan uchdan bir kenglikdagi kartada)
      flex konteyner aylanani siqib, uni yupqa chiziqqa aylantirib qo'yardi.
      `flex-wrap` esa joy yetmasa legendani pastga tushiradi.
    */
    <div className="flex flex-wrap items-center justify-center gap-5">
      <div className="shrink-0" style={{ width: 168, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius="66%"
              outerRadius="92%"
              paddingAngle={1.5}
              stroke="none"
            >
              {slices.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [fullUzs(value), name]}
              {...getTooltipStyle(colors)}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="min-w-40 flex-1 divide-y divide-line">
        {slices.map((slice) => {
          const percent = Math.round((slice.value / total) * 100);

          return (
            <li key={slice.name} className="flex items-center gap-2.5 py-2">
              <span
                className="h-2 w-2 shrink-0 rounded-xs"
                style={{ background: slice.color }}
              />
              <span className={`text-sm flex-1 ${theme.soft}`}>
                {slice.name}
              </span>
              <span
                className={`text-sm font-medium tabular-nums ${theme.text}`}
              >
                {percent}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
