import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (window.location.protocol === "https:"
    ? "https://abrorbek.me/api"
    : "http://localhost:3000/api");

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("crm_access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("crm_access_token");
      if (window.location.pathname !== "/") {
        window.location.replace("/");
      }
    }
    console.error("API Error:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error?.response?.status,
      message: error?.response?.data?.message || error.message,
      data: error?.response?.data,
    });
    return Promise.reject(error);
  },
);
