import { TONE } from "../../theme/tokens";

/**
 * Holat yorlig'i: "To'landi", "Qarzdor", "Faol", "Tugagan".
 *
 * Rang bu yerda bezak emas — u ma'no tashiydi, shuning uchun `tone` faqat
 * status ranglaridan tanlanadi. Bir ekranda beshta har xil rangdagi yorliq
 * bo'lsa, ularning hech biri e'tiborni tortmay qo'yadi: shu sababli
 * odatiy qiymat — neytral.
 */
export default function Badge({
  tone = "neutral",
  dot = false,
  size = "sm",
  className = "",
  children,
}) {
  const sizing =
    size === "xs"
      ? "text-2xs px-1.5 py-0.5 gap-1"
      : "text-xs px-2 py-0.5 gap-1.5";

  return (
    <span
      className={`inline-flex items-center rounded-md border font-medium
        whitespace-nowrap ${sizing} ${TONE[tone] || TONE.neutral} ${className}`}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full bg-current opacity-80"
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
