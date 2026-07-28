import { useTheme } from "../../theme/themeContext";

export default function SectionHeader({ title, subtitle, action }) {
  const { theme } = useTheme();

  return (
    <div className="flex items-start justify-between gap-4 mb-5 min-w-0">
      <div className="min-w-0">
        <h2 className={`text-lg font-semibold ${theme.text}`}>{title}</h2>
        {subtitle && (
          <p className={`text-sm mt-1 ${theme.soft}`}>{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
