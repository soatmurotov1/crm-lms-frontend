import { useTheme } from "../../theme/themeContext";
import Card from "./Card";
import SectionHeader from "./SectionHeader";

const TONE_BADGES = {
  violet: {
    dark: "bg-violet-500/15 text-violet-300",
    light: "bg-violet-50 text-violet-600",
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
  slate: {
    dark: "bg-slate-500/15 text-slate-300",
    light: "bg-slate-100 text-slate-600",
  },
};

/**
 * Dashboard'lardagi ro'yxat kartalari uchun umumiy ko'rinish:
 * "Faol tashkilotlar", "Kutilayotgan to'lovlar", "Top o'quvchilar" va h.k.
 *
 * items: [{ id, title, meta, badge, tone, onClick }]
 */
export default function ListCard({
  title,
  subtitle,
  action,
  items = [],
  emptyText = "Ma'lumot yo'q",
  loading = false,
  maxHeight,
  className = "",
}) {
  const { theme, darkMode } = useTheme();

  return (
    <Card className={className}>
      <SectionHeader title={title} subtitle={subtitle} action={action} />

      {loading ? (
        <p className={`text-sm ${theme.soft}`}>Yuklanmoqda...</p>
      ) : items.length === 0 ? (
        <p className={`text-sm ${theme.soft}`}>{emptyText}</p>
      ) : (
        <ul
          className="space-y-2 overflow-y-auto"
          style={maxHeight ? { maxHeight } : undefined}
        >
          {items.map((item) => {
            const badgeTone = (TONE_BADGES[item.tone] || TONE_BADGES.slate)[
              darkMode ? "dark" : "light"
            ];

            const Wrapper = item.onClick ? "button" : "div";

            return (
              <li key={item.id}>
                <Wrapper
                  {...(item.onClick
                    ? { type: "button", onClick: item.onClick }
                    : {})}
                  className={`w-full flex items-center gap-3 rounded-2xl border p-3 text-left ${
                    theme.rowBorder
                  } ${item.onClick ? `cursor-pointer ${theme.hover}` : ""}`}
                >
                  {item.icon && (
                    <span
                      className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-base ${badgeTone}`}
                    >
                      {item.icon}
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-semibold truncate ${theme.text}`}
                    >
                      {item.title}
                    </p>
                    {item.meta && (
                      <p className={`text-xs mt-0.5 truncate ${theme.soft}`}>
                        {item.meta}
                      </p>
                    )}
                  </div>

                  {item.badge && (
                    <span
                      className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${badgeTone}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Wrapper>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
