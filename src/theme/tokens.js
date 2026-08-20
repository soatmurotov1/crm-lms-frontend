/**
 * EduCenter dizayn tokenlari — sinf nomlari darajasidagi yagona manba.
 *
 * Ranglarning o'zi `index.css` da yashaydi va `[data-theme="dark"]` ostida
 * qayta e'lon qilinadi. Ya'ni `bg-surface` yorug' rejimda oq, tungi rejimda
 * to'q ko'rinadi — bitta sinf, ikkita natija.
 *
 * Shu sababli bu yerda ikkita alohida obyekt saqlashning hojati yo'q:
 * `getThemeTokens` ikkala rejimda ham bir xil to'plamni qaytaradi.
 * Funksiya imzosi va kalit nomlari eski holicha qoldirildi — ularga
 * o'nlab sahifa tayanadi.
 */

const tokens = {
  /* ---- Qobiq ---- */
  app: "bg-canvas",
  main: "bg-canvas",
  shell: "bg-canvas text-fg",
  sidebar: "bg-surface border-line",
  subpanel: "bg-surface border-line shadow-md",

  /* ---- Sirtlar ---- */
  card: "bg-surface border-line",
  panel: "bg-surface border-line",

  /* ---- Matn ---- */
  text: "text-fg",
  soft: "text-fg-muted",
  muted: "text-fg-muted",
  subtle: "text-fg-subtle",

  /* ---- Navigatsiya ----
     Aktiv element to'la bo'yalgan tugma emas: yumshoq fon + kuchli matn
     ko'z uchun tinchroq va ro'yxatni "rangli tugmalar to'plami"ga
     aylantirmaydi. */
  menu: "text-fg-muted",
  hover: "hover:bg-surface-2 hover:text-fg",
  active: "bg-accent-soft text-accent-soft-fg",
  submenuActive: "bg-accent-soft text-accent-soft-fg",
  submenuText: "text-fg-muted",

  /* ---- Boshqaruv elementlari ---- */
  topBtn:
    "bg-surface border-line text-fg-muted hover:text-fg hover:bg-surface-2",
  button: "bg-accent hover:bg-accent-hover text-accent-fg",
  secondary: "bg-surface-2 hover:bg-surface-3 text-fg border-line",
  danger: "bg-danger hover:bg-danger-hover text-white",

  input:
    "bg-surface border-line-strong text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none",
  select: "bg-surface border-line-strong text-fg",

  /* ---- Jadval / ro'yxat ---- */
  rowBorder: "border-line",
  tableHead: "bg-surface-2 text-fg-muted",
  rowHover: "hover:bg-surface-2",

  /* ---- Tab va yorliqlar ---- */
  tab: "bg-transparent text-fg-muted border-transparent hover:text-fg",
  tabActive: "bg-accent-soft text-accent-soft-fg border-accent-border",
  chip: "bg-surface-2 text-fg-muted border-line",

  /* ---- Qatlamlar ---- */
  overlay: "bg-overlay",
};

// Sahifalar tokenlarni mutatsiya qilmasligi uchun.
Object.freeze(tokens);

export function getThemeTokens() {
  return tokens;
}

/**
 * Status ranglari — faqat ma'no tashiganda ishlatiladi (to'landi, qarz,
 * kutilmoqda, bekor qilingan). Bezak uchun emas.
 */
export const TONE = Object.freeze({
  neutral: "bg-surface-2 text-fg-muted border-line",
  accent: "bg-accent-soft text-accent-soft-fg border-accent-border",
  success: "bg-success-soft text-success border-success-border",
  warning: "bg-warning-soft text-warning border-warning-border",
  danger: "bg-danger-soft text-danger border-danger-border",
});
