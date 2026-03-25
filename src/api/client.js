import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 
  (window.location.protocol === 'https:' 
    ? 'http://152.42.236.206:4040' 
    : 'http://localhost:3000')
    

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
    return Promise.reject(error);
  },
);
