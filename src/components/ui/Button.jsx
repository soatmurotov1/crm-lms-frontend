import Icon from "./Icon";

/**
 * Ilovadagi yagona tugma. Avval har sahifa o'z tugmasini 8-10 ta Tailwind
 * sinfi bilan qaytadan yozardi va natijada bir ekranda uch xil balandlikdagi,
 * uch xil radiusdagi tugmalar chiqib qolardi.
 *
 * Variantlar ma'no bo'yicha tanlanadi, ko'rinish bo'yicha emas:
 *   primary   — ekrandagi asosiy harakat. Bir ekranda bittadan ko'p emas.
 *   secondary — teng darajadagi ikkilamchi harakatlar (Bekor qilish, Filtr).
 *   ghost     — jadval qatoridagi, panel burchagidagi mayda harakatlar.
 *   danger    — qaytarib bo'lmaydigan harakat (O'chirish).
 *   link      — matn ichidagi harakat.
 */

const VARIANTS = {
  primary:
    "bg-accent text-accent-fg border-transparent hover:bg-accent-hover active:bg-accent-active",
  secondary:
    "bg-surface text-fg border-line-strong hover:bg-surface-2 active:bg-surface-3",
  ghost:
    "bg-transparent text-fg-muted border-transparent hover:bg-surface-2 hover:text-fg",
  danger:
    "bg-danger text-white border-transparent hover:bg-danger-hover",
  dangerGhost:
    "bg-transparent text-danger border-transparent hover:bg-danger-soft",
  link: "bg-transparent text-accent border-transparent hover:underline underline-offset-4 px-0",
};

const SIZES = {
  xs: "h-7 px-2 text-xs gap-1.5 rounded-md",
  sm: "h-8 px-3 text-sm gap-1.5 rounded-md",
  md: "h-9 px-3.5 text-sm gap-2 rounded-md",
  lg: "h-10 px-4 text-sm gap-2 rounded-lg",
};

const ICON_SIZES = { xs: 14, sm: 15, md: 16, lg: 18 };

export default function Button({
  variant = "secondary",
  size = "md",
  icon,
  iconRight,
  loading = false,
  disabled = false,
  full = false,
  className = "",
  children,
  type = "button",
  ...rest
}) {
  const iconSize = ICON_SIZES[size] || 16;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center whitespace-nowrap border font-medium
        transition-colors duration-100 disabled:pointer-events-none
        ${SIZES[size] || SIZES.md} ${VARIANTS[variant] || VARIANTS.secondary}
        ${full ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {loading ? (
        <Spinner size={iconSize} />
      ) : (
        icon && <Icon name={icon} size={iconSize} />
      )}

      {children}

      {iconRight && !loading && <Icon name={iconRight} size={iconSize} />}
    </button>
  );
}

/**
 * Faqat ikonkadan iborat tugma — jadval qatoridagi tahrirlash/o'chirish
 * kabi harakatlar uchun. `label` ekran o'quvchi uchun majburiy.
 */
export function IconButton({
  icon,
  label,
  variant = "ghost",
  size = "md",
  className = "",
  ...rest
}) {
  const box = size === "sm" ? "h-8 w-8" : "h-9 w-9";

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`inline-flex items-center justify-center rounded-md border
        transition-colors duration-100 disabled:pointer-events-none
        ${box} ${VARIANTS[variant] || VARIANTS.ghost} ${className}`}
      {...rest}
    >
      <Icon name={icon} size={size === "sm" ? 15 : 17} />
    </button>
  );
}

function Spinner({ size }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2.5"
        opacity="0.25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
