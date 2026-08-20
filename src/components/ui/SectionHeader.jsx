import { useTheme } from "../../theme/themeContext";

/**
 * Bo'lim sarlavhasi. Sarlavha o'lchami ataylab kichik: CRM ekranida
 * e'tibor ma'lumotga qaratilishi kerak, sarlavhaga emas — u faqat
 * yo'naltiradi.
 */
export default function SectionHeader({
  title,
  subtitle,
  action,
  className = "",
}) {
  const { theme } = useTheme();

  return (
    <div
      className={`flex items-start justify-between gap-4 mb-4 min-w-0 ${className}`}
    >
      <div className="min-w-0">
        <h2 className={`text-[0.9375rem] font-semibold leading-6 ${theme.text}`}>
          {title}
        </h2>
        {subtitle && (
          <p className={`text-[0.8125rem] mt-0.5 ${theme.soft}`}>{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
