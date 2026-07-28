import { useTheme } from "../../theme/themeContext";
import Card from "./Card";

/**
 * Backend'da hali endpoint bo'lmagan bo'limlar uchun bir xil ko'rinish.
 * Foydalanuvchiga bo'lim nima uchun kerakligi va nimasi yetishmayotgani
 * ochiq aytiladi — bo'sh oq ekran qoldirilmaydi.
 */
export default function PlaceholderSection({
  icon = "🧩",
  title,
  description,
  points = [],
  note,
}) {
  const { theme } = useTheme();

  return (
    <Card>
      <div className="flex items-start gap-4">
        <span className="w-12 h-12 shrink-0 rounded-2xl bg-violet-500/15 text-violet-500 flex items-center justify-center text-2xl">
          {icon}
        </span>

        <div className="min-w-0">
          <h2 className={`text-lg font-semibold ${theme.text}`}>{title}</h2>
          {description && (
            <p className={`text-sm mt-1 ${theme.soft}`}>{description}</p>
          )}

          {points.length > 0 && (
            <ul className="mt-4 space-y-2">
              {points.map((point) => (
                <li key={point} className={`text-sm flex gap-2 ${theme.soft}`}>
                  <span className="text-violet-500">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          )}

          {note && (
            <p
              className={`text-xs mt-4 rounded-xl border p-3 ${theme.rowBorder} ${theme.soft}`}
            >
              {note}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
