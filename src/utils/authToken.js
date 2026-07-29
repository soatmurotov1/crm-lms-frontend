export const ACCESS_TOKEN_KEY = "crm_access_token";

/** Chiqishda tozalanmaydigan kalitlar — bular shaxsiy ma'lumot emas. */
const KEPT_ON_LOGOUT = new Set(["crm_theme_v1"]);

export function parseAuthToken(token) {
  if (!token) return null;

  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");

    const decoded = JSON.parse(window.atob(payload));
    return decoded && typeof decoded === "object" ? decoded : null;
  } catch {
    return null;
  }
}

/**
 * Token muddati tugaganmi. `exp` yo'q bo'lsa ham tugagan deb hisoblaymiz:
 * backend har doim muddat qo'yadi, ya'ni muddatsiz token soxta.
 */
export function isTokenExpired(payload) {
  const exp = Number(payload?.exp);
  if (!Number.isFinite(exp)) return true;

  return Date.now() >= exp * 1000;
}

/**
 * Tokenni ham, keshlangan ma'lumotlarni ham o'chiradi. Faqat tokenni
 * o'chirish yetarli emas: bitta qurilmada foydalanuvchi almashsa, oldingi
 * foydalanuvchining ro'yxatlari keshda qolib ketadi.
 */
export function clearAuthSession() {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith("crm_") && !KEPT_ON_LOGOUT.has(key))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // Storage ishlamasa ham ilova ishlashda davom etsin.
  }
}

/**
 * Amaldagi sessiya ma'lumoti. Token yaroqsiz yoki muddati tugagan bo'lsa
 * `null` qaytaradi va sessiyani tozalab yuboradi.
 */
export function getAuthUserFromStorage() {
  let token = null;

  try {
    token = localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }

  if (!token) return null;

  const payload = parseAuthToken(token);

  if (!payload || isTokenExpired(payload)) {
    clearAuthSession();
    return null;
  }

  return payload;
}

/** Foydalanuvchi tizimga kirganmi — muddati tugamagan token bormi. */
export function hasValidSession() {
  return getAuthUserFromStorage() !== null;
}
