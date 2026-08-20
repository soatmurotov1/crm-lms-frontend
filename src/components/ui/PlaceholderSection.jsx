import { useTheme } from "../../theme/themeContext";
import Card from "./Card";
import Icon from "./Icon";

/**
 * Backend'da hali endpoint bo'lmagan bo'limlar uchun bir xil ko'rinish.
 * Foydalanuvchiga bo'lim nima uchun kerakligi va nimasi yetishmayotgani
 * ochiq aytiladi — bo'sh oq ekran qoldirilmaydi.
 */
export default function PlaceholderSection({
  icon = "puzzle",
  title,
  description,
  points = [],
  note,
}) {
  const { theme } = useTheme();

  return (
    <Card>
      <div className="flex items-start gap-4">
        <span
          className="w-10 h-10 shrink-0 rounded-lg border border-line bg-surface-2
            text-fg-subtle flex items-center justify-center"
        >
          <Icon name={icon} size={18} />
        </span>

        <div className="min-w-0">
          <h2 className={`text-[0.9375rem] font-semibold ${theme.text}`}>
            {title}
          </h2>
          {description && (
            <p className={`text-sm mt-1 ${theme.soft}`}>{description}</p>
          )}

          {points.length > 0 && (
            <ul className="mt-4 space-y-2">
              {points.map((point) => (
                <li
                  key={point}
                  className={`text-sm flex gap-2.5 items-start ${theme.soft}`}
                >
                  <Icon
                    name="check"
                    size={15}
                    className="mt-0.5 text-fg-subtle"
                  />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          )}

          {note && (
            <p
              className={`text-xs mt-4 rounded-md border border-line bg-surface-2 p-3 ${theme.soft}`}
            >
              {note}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
