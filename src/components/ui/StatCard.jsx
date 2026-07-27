import { useTheme } from "../../theme/themeContext";

const TONE_CHIPS = {
  violet: {
    dark: "bg-violet-500/15 text-violet-300",
    light: "bg-violet-50 text-violet-600",
  },
  blue: {
    dark: "bg-blue-500/15 text-blue-300",
    light: "bg-blue-50 text-blue-600",
  },
  emerald: {
    dark: "bg-emerald-500/15 text-emerald-300",
    light: "bg-emerald-50 text-emerald-600",
  },
  amber: {
    dark: "bg-amber-500/15 text-amber-300",
    light: "bg-amber-50 text-amber-600",
  },
  rose: {
    dark: "bg-rose-500/15 text-rose-300",
    light: "bg-rose-50 text-rose-600",
  },
};

/**
 * Mockupdagi statistika kartasi: rangli ikonka chipi, katta qiymat va
 * ixtiyoriy o'zgarish ko'rsatkichi (+12% / -3%).
 */
export default function StatCard({
  icon,
  label,
  value,
  delta,
  deltaLabel,
  tone = "violet",
  onClick,
}) {
  const { theme, darkMode } = useTheme();

  const chip = (TONE_CHIPS[tone] || TONE_CHIPS.violet)[
    darkMode ? "dark" : "light"
  ];

  const hasDelta = Number.isFinite(delta);
  const isPositive = hasDelta && delta >= 0;
  const deltaColor = isPositive ? "text-emerald-500" : "text-rose-500";

  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      {...(onClick ? { type: "button", onClick } : {})}
      className={`${theme.card} border rounded-2xl p-5 shadow-sm text-left w-full ${
        onClick ? "cursor-pointer hover:shadow-md transition" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <span
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${chip}`}
        >
          {icon}
        </span>
        {hasDelta && (
          <span className={`text-sm font-semibold ${deltaColor}`}>
            {isPositive ? "+" : ""}
            {delta}%
          </span>
        )}
      </div>

      <p className={`text-sm mb-1 ${theme.soft}`}>{label}</p>
      <h3 className={`text-3xl font-bold ${theme.text}`}>{value}</h3>

      {deltaLabel && (
        <p className={`text-xs mt-2 ${theme.soft}`}>{deltaLabel}</p>
      )}
    </Wrapper>
  );
}
