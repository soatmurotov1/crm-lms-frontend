import axios from "axios";
import { ACCESS_TOKEN_KEY, clearAuthSession } from "../utils/authToken";

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
  (error) => {
    if (error?.response?.status === 401) {
      // Token yaroqsiz — keshlangan ma'lumotlar bilan birga tozalanadi.
      clearAuthSession();
      if (window.location.pathname !== "/") {
        window.location.replace("/");
      }
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
