import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useTheme } from "../../theme/themeContext";
import { getChartColors } from "./chartTheme";

const DONUT_PALETTE = [
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#3b82f6",
  "#f43f5e",
  "#14b8a6",
  "#a855f7",
  "#64748b",
];

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

  const data = slices.map((slice, index) => ({
    name: slice.name,
    value: Number(slice.value || 0),
    color: slice.color || DONUT_PALETTE[index % DONUT_PALETTE.length],
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
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative shrink-0" style={{ width: 180, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="90%"
              paddingAngle={2}
              stroke="none"
            >
              {data.map((item) => (
                <Cell key={item.name} fill={item.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [formatValue(value), name]}
              contentStyle={{
                background: colors.tooltipBg,
                border: `1px solid ${colors.tooltipBorder}`,
                borderRadius: 12,
                color: colors.tooltipText,
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {(centerValue || centerLabel) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className={`text-2xl font-bold ${theme.text}`}>
              {centerValue}
            </span>
            <span className={`text-xs ${theme.soft}`}>{centerLabel}</span>
          </div>
        )}
      </div>

      <ul className="flex-1 w-full space-y-3">
        {data.map((item) => {
          const percent = Math.round((item.value / total) * 100);

          return (
            <li key={item.name} className="flex items-center gap-3">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: item.color }}
              />
              <span className={`text-sm flex-1 truncate ${theme.soft}`}>
                {item.name}
              </span>
              <span className={`text-sm font-semibold ${theme.text}`}>
                {formatValue(item.value)}
              </span>
              <span className={`text-xs w-10 text-right ${theme.soft}`}>
                {percent}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
