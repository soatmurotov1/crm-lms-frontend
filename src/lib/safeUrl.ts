/**
 * Foydalanuvchi kiritgan havolani `href` ga qo'yishdan oldin tekshiradi.
 *
 * `javascript:`, `data:`, `vbscript:` kabi sxemalar bosilganda sahifa ichida
 * skript ishga tushiradi (stored XSS). Faqat http(s) va mailto/tel ruxsat
 * etiladi; boshqasi bo'lsa `undefined` qaytadi va havola bosilmaydi.
 */
const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

export function safeUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  try {
    const parsed = new URL(trimmed, window.location.origin);
    return SAFE_PROTOCOLS.has(parsed.protocol) ? parsed.href : undefined;
  } catch {
    return undefined;
  }
}
