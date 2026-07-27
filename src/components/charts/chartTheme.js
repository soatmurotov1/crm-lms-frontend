/**
 * Grafiklar uchun umumiy ranglar. Recharts SVG ichida ishlagani uchun
 * Tailwind sinflari emas, aniq rang qiymatlari kerak bo'ladi.
 */
export function getChartColors(darkMode) {
  return darkMode
    ? {
        grid: "#1e293b",
        axis: "#64748b",
        tooltipBg: "#0f172a",
        tooltipBorder: "#334155",
        tooltipText: "#f8fafc",
        accent: "#8b5cf6",
        paid: "#10b981",
        debt: "#f43f5e",
        pending: "#f59e0b",
      }
    : {
        grid: "#e2e8f0",
        axis: "#94a3b8",
        tooltipBg: "#ffffff",
        tooltipBorder: "#e2e8f0",
        tooltipText: "#0f172a",
        accent: "#7c3aed",
        paid: "#059669",
        debt: "#e11d48",
        pending: "#d97706",
      };
}

export const compactUzs = (value) => {
  const number = Number(value || 0);

  if (Math.abs(number) >= 1_000_000_000) {
    return `${(number / 1_000_000_000).toFixed(1)} mlrd`;
  }
  if (Math.abs(number) >= 1_000_000) {
    return `${(number / 1_000_000).toFixed(1)} mln`;
  }
  if (Math.abs(number) >= 1_000) {
    return `${Math.round(number / 1_000)} ming`;
  }
  return String(number);
};

export const fullUzs = (value) =>
  `${new Intl.NumberFormat("uz-UZ").format(Number(value || 0))} so'm`;

export const MONTH_LABELS = [
  "Yan",
  "Fev",
  "Mar",
  "Apr",
  "May",
  "Iyun",
  "Iyul",
  "Avg",
  "Sen",
  "Okt",
  "Noy",
  "Dek",
];
