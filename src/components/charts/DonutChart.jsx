import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useTheme } from "../../theme/themeContext";
import {
  getChartColors,
  getSeriesPalette,
  getTooltipStyle,
} from "./chartTheme";

/**
 * Umumiy aylana (donut) grafik: tariflar bo'yicha taqsimot, davomat holati
 * va shunga o'xshash bo'linmalar uchun.
 *
 * slices: [{ name, value, color? }]
 */
export default function DonutChart({
  slices = [],
  height = 220,
  formatValue = (value) => new Intl.NumberFormat("uz-UZ").format(value),
  emptyText = "Ma'lumot yo'q",
  centerLabel,
  centerValue,
}) {
  const { darkMode, theme } = useTheme();
  const colors = getChartColors(darkMode);
  const palette = getSeriesPalette(darkMode);

  const data = slices.map((slice, index) => ({
    name: slice.name,
    value: Number(slice.value || 0),
    color: slice.color || palette[index % palette.length],
  }));

  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (!total) {
    return (
      <div
        className={`flex items-center justify-center text-sm ${theme.soft}`}
        style={{ height }}
      >
        {emptyText}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-5">
      <div className="relative shrink-0" style={{ width: 168, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="66%"
              outerRadius="92%"
              paddingAngle={1.5}
              stroke="none"
            >
              {data.map((item) => (
                <Cell key={item.name} fill={item.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [formatValue(value), name]}
              {...getTooltipStyle(colors)}
            />
          </PieChart>
        </ResponsiveContainer>

        {(centerValue || centerLabel) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span
              className={`text-xl font-semibold tabular-nums ${theme.text}`}
            >
              {centerValue}
            </span>
            <span className={`text-xs mt-0.5 ${theme.subtle}`}>
              {centerLabel}
            </span>
          </div>
        )}
      </div>

      {/*
        Legenda — jadval, ro'yxat emas: nom chapda, son o'ngda bir chiziqda
        tursa, qiymatlarni bir-biriga taqqoslash osonlashadi.
      */}
      <ul className="min-w-40 flex-1 divide-y divide-line">
        {data.map((item) => {
          const percent = Math.round((item.value / total) * 100);

          return (
            <li key={item.name} className="flex items-center gap-2.5 py-2">
              <span
                className="h-2 w-2 shrink-0 rounded-xs"
                style={{ background: item.color }}
              />
              <span className={`text-sm flex-1 truncate ${theme.soft}`}>
                {item.name}
              </span>
              <span
                className={`text-sm font-medium tabular-nums ${theme.text}`}
              >
                {formatValue(item.value)}
              </span>
              <span
                className={`text-xs w-9 text-right tabular-nums ${theme.subtle}`}
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
