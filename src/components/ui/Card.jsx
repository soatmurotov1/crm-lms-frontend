import { useTheme } from "../../theme/themeContext";

/**
 * Asosiy sirt. Chuqurlikni soya emas, chegara beradi — shuning uchun
 * ekranda o'nlab karta bo'lganda ham interfeys tekis va tinch ko'rinadi.
 *
 * `padded={false}` — ichida jadval yoki o'z ichki bo'linmalari bor tarkib
 * uchun: bunda karta faqat ramka bo'lib qoladi.
 */
export default function Card({
  children,
  className = "",
  padded = true,
  ...rest
}) {
  const { theme } = useTheme();

  return (
    <div
      className={`${theme.card} border rounded-lg min-w-0 ${
        padded ? "p-4 sm:p-5" : ""
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
