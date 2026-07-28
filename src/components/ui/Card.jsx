import { useTheme } from "../../theme/themeContext";

export default function Card({ children, className = "", ...rest }) {
  const { theme } = useTheme();

  return (
    <div
      className={`${theme.card} border rounded-2xl p-4 sm:p-6 shadow-sm min-w-0 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
