import axios from "axios";
import {
  ACCESS_TOKEN_KEY,
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  isTokenExpired,
  parseAuthToken,
  saveAuthTokens,
} from "../utils/authToken";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (window.location.protocol === "https:"
    ? "https://abrorbek.me/api"
    : "http://localhost:4040/api");

// So'rov/javob tafsilotlari faqat development'da konsolga chiqadi: ishlab
// chiqarishda ular endpointlar va ichki xatolik matnlarini oshkor qiladi.
const IS_DEV = import.meta.env.DEV;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

/**
 * Token yangilash uchun alohida, interceptorsiz mijoz.
 *
 * `apiClient` orqali yuborilsa, `/auth/refresh` ning o'zi 401 qaytarganda
 * yana yangilashga urinilib, cheksiz halqa hosil bo'lardi.
 */
const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

/**
 * Bir vaqtda ketgan o'nta so'rov ham 401 oladi. Har biri alohida yangilashga
 * urinsa, birinchisi refresh tokenni almashtiradi va qolganlari eskisi bilan
 * kelib sessiyani yopib qo'yadi (server ishlatilgan tokenni o'g'irlik deb
 * biladi). Shuning uchun yangilash bitta va'dada bo'ladi.
 */
let refreshPromise = null;

async function requestNewTokens() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const response = await refreshClient.post("/auth/refresh", { refreshToken });
  const accessToken = response?.data?.accessToken || response?.data?.access_token;

  if (!accessToken) return null;

  saveAuthTokens({
    accessToken,
    refreshToken: response?.data?.refreshToken,
  });

  return accessToken;
}

/** Yangi access token oladi; imkoni bo'lmasa `null`. */
export function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = requestNewTokens()
      .catch((error) => {
        if (IS_DEV) console.error("Token yangilanmadi:", error?.message);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

/** Sessiyani tozalab, login sahifasiga qaytaradi. */
function endSession() {
  clearAuthSession();
  if (window.location.pathname !== "/") {
    window.location.replace("/");
  }
}

/**
 * Ilova ochilganda chaqiriladi: saqlangan access token eskirgan bo'lsa,
 * refresh token bilan yangilanadi. Busiz 2 soatdan keyin qaytgan foydalanuvchi
 * amaldagi sessiyasi bo'la turib login sahifasini ko'rardi.
 */
export async function bootstrapSession() {
  const token = getAccessToken();
  if (!token) return false;

  const payload = parseAuthToken(token);

  if (payload && !isTokenExpired(payload)) return true;

  if (!getRefreshToken()) {
    clearAuthSession();
    return false;
  }

  const refreshed = await refreshAccessToken();

  if (!refreshed) {
    clearAuthSession();
    return false;
  }

  return true;
}

/**
 * Chiqish. Avval serverga aytiladi — sessiya o'sha yerda yopilishi kerak,
 * aks holda o'chirilgan token qurilmada qolib ketsa ham ishlayverardi.
 * Server javob bermasa ham mahalliy tozalash baribir bajariladi.
 */
export async function logout({ allDevices = false } = {}) {
  const refreshToken = getRefreshToken();
  const accessToken = getAccessToken();

  try {
    if (allDevices && accessToken) {
      await apiClient.post("/auth/logout-all");
    } else {
      await refreshClient.post(
        "/auth/logout",
        refreshToken ? { refreshToken } : {},
        accessToken
          ? { headers: { Authorization: `Bearer ${accessToken}` } }
          : undefined,
      );
    }
  } catch (error) {
    if (IS_DEV) console.error("Logout xatosi:", error?.message);
  } finally {
    clearAuthSession();
  }
}

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);

  if (IS_DEV) {
    console.log("API Request:", {
      url: config.url,
      method: config.method,
      hasToken: !!token,
    });
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error?.config;

    /*
      401 ikki xil bo'lishi mumkin: access token muddati tugagan (yangilash
      kerak) yoki sessiya serverda yopilgan (chiqish kerak). Ikkalasini
      ajratmasdan avval bir marta yangilab ko'ramiz — sessiya yopilgan bo'lsa
      yangilash ham 401 beradi va shunda chiqamiz.

      `_retried` bayrog'i bitta so'rov cheksiz aylanib qolmasligi uchun.
    */
    if (error?.response?.status === 401 && request && !request._retried) {
      request._retried = true;

      const newToken = await refreshAccessToken();

      if (newToken) {
        request.headers = request.headers || {};
        request.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(request);
      }

      endSession();
    } else if (error?.response?.status === 401) {
      endSession();
    }

    if (IS_DEV) {
      console.error("API Error:", {
        url: error.config?.url,
        method: error.config?.method,
        status: error?.response?.status,
        message: error?.response?.data?.message || error.message,
      });
    }

    return Promise.reject(error);
  },
);
