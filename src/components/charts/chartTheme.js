/**
 * Grafiklar uchun umumiy ranglar.
 *
 * Recharts SVG ichida ishlagani uchun Tailwind sinflari emas, aniq rang
 * qiymatlari kerak bo'ladi — shuning uchun bu yerdagi qiymatlar
 * `index.css` dagi `--c-*` tokenlari bilan qo'lda mos tutiladi.
 * Tokenlardan birortasi o'zgarsa, bu ro'yxat ham yangilanishi kerak.
 *
 * Grafikda rang ikki xil ishlaydi va ularni aralashtirmaslik muhim:
 *   - `accent` — o'lchanayotgan yagona kattalik (daromad, davomat foizi).
 *     Bitta qiymat ko'rsatilayotganda uni rang-barang qilishning ma'nosi yo'q.
 *   - `paid/debt/pending` — ma'no tashiydigan holatlar. Ular yashil/qizil/sariq,
 *     chunki foydalanuvchi bu ranglarni allaqachon shunday o'qiydi.
 */
export function getChartColors(darkMode) {
  return darkMode
    ? {
        grid: "#27272b",
        axis: "#71717a",
        tooltipBg: "#1c1c20",
        tooltipBorder: "#3a3a41",
        tooltipText: "#fafafa",
        accent: "#3b82f6",
        // Grafikdagi ranglar matnnikidan bosiqroq: katta yuzani to'yingan
        // rang bilan bo'yash ekranni "o'yinchoq" ko'rinishga olib keladi.
        paid: "#4aa87a",
        debt: "#d9706c",
        pending: "#c9a24d",
      }
    : {
        grid: "#e4e4e7",
        axis: "#8e8e97",
        tooltipBg: "#ffffff",
        tooltipBorder: "#d4d4d8",
        tooltipText: "#18181b",
        accent: "#2563eb",
        paid: "#2f8f63",
        debt: "#c9524f",
        pending: "#b08430",
      };
}

/**
 * Toifalar bo'yicha taqsimot uchun (tariflar, guruhlar). Ranglar ohang
 * va yorqinlik bo'yicha navbatlashadi, shuning uchun yonma-yon turganda
 * ham, rang ko'rishda farqi bor foydalanuvchi uchun ham ajraladi.
 */
export function getSeriesPalette(darkMode) {
  return darkMode
    ? ["#60a5fa", "#2dd4bf", "#fbbf24", "#a78bfa", "#f87171", "#94a3b8"]
    : ["#2563eb", "#0d9488", "#a16207", "#7c3aed", "#dc2626", "#71717a"];
}

/**
 * Tooltip barcha grafiklarda bir xil ko'rinishi uchun. Recharts tooltipni
 * inline uslub bilan chizadi, ya'ni uni CSS'dan boshqarib bo'lmaydi.
 */
export function getTooltipStyle(colors) {
  return {
    contentStyle: {
      background: colors.tooltipBg,
      border: `1px solid ${colors.tooltipBorder}`,
      borderRadius: 6,
      boxShadow: "0 4px 12px -2px rgb(0 0 0 / 0.12)",
      color: colors.tooltipText,
      fontSize: 12,
      padding: "6px 10px",
    },
    labelStyle: {
      color: colors.tooltipText,
      fontWeight: 500,
      marginBottom: 2,
    },
    itemStyle: { color: colors.tooltipText, padding: 0 },
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
