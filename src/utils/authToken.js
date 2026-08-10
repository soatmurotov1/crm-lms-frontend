export const ACCESS_TOKEN_KEY = "crm_access_token";
export const REFRESH_TOKEN_KEY = "crm_refresh_token";

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

export function getAccessToken() {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getRefreshToken() {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Login yoki token yangilangandan keyin ikkala tokenni saqlaydi.
 *
 * Refresh token javobda kelmasa eskisi saqlanib qoladi: eski backend
 * (refresh'siz deploy) bilan ishlaganda ham sessiya buzilmasin.
 */
export function saveAuthTokens({ accessToken, refreshToken }) {
  try {
    if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } catch {
    // Storage ishlamasa ham ilova ishlashda davom etsin.
  }
}

/**
 * Sessiya belgisi — access token ichidagi `sid`.
 *
 * Kesh kalitlari shunga bog'lanadi: token har yangilanganda o'zgaradi, `sid`
 * esa sessiya davomida bir xil qoladi, ya'ni yangilanish keshni bekorga
 * yo'qotmaydi. Ayni paytda boshqa foydalanuvchining keshiga ham tushmaydi.
 */
export function getSessionScope() {
  const token = getAccessToken();
  if (!token) return "guest";

  const payload = parseAuthToken(token);
  return payload?.sid || token.slice(-16);
}

/**
 * Amaldagi sessiya ma'lumoti. Token yaroqsiz yoki muddati tugagan bo'lsa
 * `null` qaytaradi.
 *
 * Muddati tugagan token endi sessiyani darhol o'chirmaydi: refresh token
 * bo'lsa, `bootstrapSession()` uni yangilab beradi. Tozalash faqat token
 * umuman o'qib bo'lmaydigan bo'lsa yoki refresh ham yo'q bo'lsa bo'ladi.
 */
export function getAuthUserFromStorage() {
  const token = getAccessToken();
  if (!token) return null;

  const payload = parseAuthToken(token);

  if (!payload) {
    clearAuthSession();
    return null;
  }

  if (isTokenExpired(payload)) {
    if (!getRefreshToken()) {
      clearAuthSession();
      return null;
    }

    return null;
  }

  return payload;
}

/** Foydalanuvchi tizimga kirganmi — muddati tugamagan token bormi. */
export function hasValidSession() {
  return getAuthUserFromStorage() !== null;
}
