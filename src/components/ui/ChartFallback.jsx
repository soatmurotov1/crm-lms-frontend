import { useTheme } from "../../theme/themeContext";

export default function ChartFallback({ height = 260 }) {
  const { theme } = useTheme();

  return (
    <div
      className={`flex items-center justify-center text-sm ${theme.soft}`}
      style={{ height }}
    >
      Grafik yuklanmoqda...
    </div>
  );
}
