import { useTheme } from "../../theme/themeContext";

export default function Card({ children, className = "", ...rest }) {
  const { theme } = useTheme();

  return (
    <div
      className={`${theme.card} border rounded-2xl p-6 shadow-sm ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
