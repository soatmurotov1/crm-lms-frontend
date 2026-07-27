/**
 * Backend telefon raqamni faqat `+998XXXXXXXXX` ko'rinishida qabul qiladi
 * (backend/src/common/utils/phone.util.ts). Formada esa raqam
 * `(+998)90 461-41-88` ko'rinishida ko'rsatiladi.
 */
export const PHONE_PREFIX = "+998";
export const PHONE_DISPLAY_PREFIX = "(+998)";
export const PHONE_NATIONAL_LENGTH = 9;
export const PHONE_PLACEHOLDER = "(+998)90 000-00-00";
export const PHONE_ERROR_MESSAGE =
  "Telefon raqamini (+998)90 000-00-00 ko'rinishida to'liq kiriting";

/** `[guruh uzunligi, guruhdan oldin qo'yiladigan ajratgich]`. */
const GROUPS = [
  [2, ""],
  [3, " "],
  [2, "-"],
  [2, "-"],
];

/** Kiritilgan matndan faqat milliy raqam (prefikssiz 9 ta raqam) ajratiladi. */
export function extractNationalDigits(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  const national = digits.startsWith("998") ? digits.slice(3) : digits;
  return national.slice(0, PHONE_NATIONAL_LENGTH);
}

/** Ko'rsatish uchun: `(+998)90 461-41-88`. Bo'sh qiymatda ham prefiks qoladi. */
export function formatPhone(value) {
  const digits = extractNationalDigits(value);
  let formatted = PHONE_DISPLAY_PREFIX;
  let index = 0;

  for (const [size, separator] of GROUPS) {
    if (index >= digits.length) break;
    formatted += separator + digits.slice(index, index + size);
    index += size;
  }

  return formatted;
}

/** Backendga yuborish uchun: `+998901234567`. To'liq bo'lmasa bo'sh satr. */
export function normalizePhone(value) {
  const digits = extractNationalDigits(value);
  return digits.length === PHONE_NATIONAL_LENGTH
    ? `${PHONE_PREFIX}${digits}`
    : "";
}

export function isValidPhone(value) {
  return extractNationalDigits(value).length === PHONE_NATIONAL_LENGTH;
}
