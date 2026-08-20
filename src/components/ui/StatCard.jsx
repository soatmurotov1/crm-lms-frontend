import { useTheme } from "../../theme/themeContext";
import Icon from "./Icon";

/**
 * Statistika kartasi.
 *
 * Avvalgi variantda har bir kartaning ikonkasi o'z rangida bo'yalgan chipda
 * turardi (binafsha, ko'k, yashil, sariq, pushti — qatorma-qator). Bir
 * qatorda beshta rang bo'lsa, ularning hech biri hech narsa anglatmaydi.
 *
 * Shuning uchun bu yerda rang qat'iy me'yorlangan:
 *   - ikonka har doim neytral;
 *   - `tone` faqat `warning` va `danger` bo'lganda ishlaydi, ya'ni ko'rsatkich
 *     haqiqatan e'tibor talab qilganda (qarzdorlar, muddati o'tganlar);
 *   - o'zgarish foizi o'z ma'nosiga qarab yashil/qizil bo'ladi.
 *
 * Ko'zni tortadigan yagona narsa — sonning o'zi.
 */

const ATTENTION_TONES = {
  warning: "text-warning",
  danger: "text-danger",
};

export default function StatCard({
  icon,
  label,
  value,
  delta,
  deltaLabel,
  tone,
  onClick,
  className = "",
}) {
  const { theme } = useTheme();

  const iconColor = ATTENTION_TONES[tone] || "text-fg-subtle";

  const hasDelta = Number.isFinite(delta);
  const isPositive = hasDelta && delta >= 0;

  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      {...(onClick ? { type: "button", onClick } : {})}
      className={`${theme.card} border rounded-lg p-4 text-left w-full min-w-0
        ${onClick ? "cursor-pointer hover:border-line-strong hover:bg-surface-2 transition-colors" : ""}
        ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className={`text-[0.8125rem] leading-5 truncate ${theme.soft}`}>
          {label}
        </p>
        {icon && <Icon name={icon} size={16} className={iconColor} />}
      </div>

      <p
        className={`mt-2 text-[1.75rem] leading-9 font-semibold tabular-nums tracking-tight ${theme.text}`}
      >
        {value}
      </p>

      {(hasDelta || deltaLabel) && (
        <div className="mt-1.5 flex items-center gap-1.5 min-w-0">
          {hasDelta && (
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-medium tabular-nums
                ${isPositive ? "text-success" : "text-danger"}`}
            >
              <Icon name={isPositive ? "trendUp" : "trendDown"} size={13} />
              {isPositive ? "+" : ""}
              {delta}%
            </span>
          )}
          {deltaLabel && (
            <span className={`text-xs truncate ${theme.subtle}`}>
              {deltaLabel}
            </span>
          )}
        </div>
      )}
    </Wrapper>
  );
}
