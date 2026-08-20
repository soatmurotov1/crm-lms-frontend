import { useTheme } from "../../theme/themeContext";
import Badge from "./Badge";
import Card from "./Card";
import SectionHeader from "./SectionHeader";
import Icon from "./Icon";

/**
 * Dashboard'lardagi ro'yxat kartalari: "Faol tashkilotlar", "Kutilayotgan
 * to'lovlar", "Top o'quvchilar" va h.k.
 *
 * Har bir qator alohida ramkali "tabletka" emas, oddiy qator — ro'yxat
 * ichida o'nta ramka bo'lsa, ko'z qayerga qarashni bilmay qoladi. Qatorlar
 * bir-biridan ingichka chiziq bilan ajraladi.
 *
 * items: [{ id, title, meta, badge, tone, icon, onClick }]
 */

// Eski chaqiruvlardagi rang nomlari status ma'nosiga o'tkaziladi.
const TONE_ALIAS = {
  violet: "accent",
  blue: "accent",
  emerald: "success",
  green: "success",
  amber: "warning",
  yellow: "warning",
  rose: "danger",
  red: "danger",
  slate: "neutral",
};

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
  const { theme } = useTheme();

  return (
    <Card className={className}>
      <SectionHeader title={title} subtitle={subtitle} action={action} />

      {loading ? (
        <div className="space-y-3 py-1" aria-busy="true">
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex items-center gap-3">
              <div className="skeleton h-8 w-8 shrink-0 rounded-md" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="skeleton h-3 w-2/5" />
                <div className="skeleton h-2.5 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className={`text-sm py-2 ${theme.subtle}`}>{emptyText}</p>
      ) : (
        <ul
          className="-mx-1 overflow-y-auto"
          style={maxHeight ? { maxHeight } : undefined}
        >
          {items.map((item, index) => {
            const tone = TONE_ALIAS[item.tone] || item.tone || "neutral";
            const Wrapper = item.onClick ? "button" : "div";

            return (
              <li
                key={item.id}
                className={index > 0 ? "border-t border-line" : ""}
              >
                <Wrapper
                  {...(item.onClick
                    ? { type: "button", onClick: item.onClick }
                    : {})}
                  className={`w-full flex items-center gap-3 rounded-md px-1 py-2.5 text-left
                    ${item.onClick ? `cursor-pointer ${theme.hover}` : ""}`}
                >
                  {item.icon && (
                    <span
                      className="w-8 h-8 shrink-0 rounded-md border border-line
                        bg-surface-2 text-fg-subtle flex items-center justify-center"
                    >
                      <Icon name={item.icon} size={15} />
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-medium truncate ${theme.text}`}
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
                    <Badge tone={tone} className="shrink-0">
                      {item.badge}
                    </Badge>
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
