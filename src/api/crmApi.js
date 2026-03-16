import { apiClient } from "./client";

const unwrap = (response) => response?.data;

const appendFormDataValue = (formData, key, value) => {
  if (value === undefined || value === null || value === "") return;

  if (value instanceof File || value instanceof Blob) {
    formData.append(key, value);
    return;
  }

  formData.append(key, String(value));
};

const toFormData = (payload) => {
  const formData = new FormData();
  Object.entries(payload || {}).forEach(([key, value]) => {
    appendFormDataValue(formData, key, value);
  });
  return formData;
};

export const authApi = {
  loginAdmin: async (payload) =>
    unwrap(await apiClient.post("/auth/login/admin", payload)),
};

export const teachersApi = {
  getAll: async () => unwrap(await apiClient.get("/teachers/all")),
  create: async (payload) =>
    unwrap(await apiClient.post("/teachers", toFormData(payload))),
  update: async (id, payload) =>
    unwrap(await apiClient.put(`/teachers/${id}`, toFormData(payload))),
  remove: async (id) => unwrap(await apiClient.delete(`/teachers/${id}`)),
};

export const studentsApi = {
  getAll: async () => unwrap(await apiClient.get("/students/all")),
  create: async (payload) =>
    unwrap(await apiClient.post("/students", toFormData(payload))),
};

export const roomsApi = {
  getAll: async () => unwrap(await apiClient.get("/rooms/all")),
  create: async (payload) => unwrap(await apiClient.post("/rooms", payload)),
  update: async (id, payload) =>
    unwrap(await apiClient.put(`/rooms/${id}`, payload)),
  remove: async (id) => unwrap(await apiClient.delete(`/rooms/${id}`)),
};

export const coursesApi = {
  getAll: async () => unwrap(await apiClient.get("/course/all")),
  create: async (payload) => unwrap(await apiClient.post("/course", payload)),
  update: async (id, payload) =>
    unwrap(await apiClient.put(`/course/${id}`, payload)),
  remove: async (id) => unwrap(await apiClient.delete(`/course/${id}`)),
};

export const groupsApi = {
  getAll: async () => unwrap(await apiClient.get("/groups/all")),
  getStudentsByGroup: async (groupId) =>
    unwrap(await apiClient.get(`/groups/students/${groupId}`)),
  create: async (payload) => unwrap(await apiClient.post("/groups", payload)),
  update: async (id, payload) =>
    unwrap(await apiClient.put(`/groups/${id}`, payload)),
  remove: async (id) => unwrap(await apiClient.delete(`/groups/${id}`)),
};

export const usersApi = {
  getAll: async () => unwrap(await apiClient.get("/users")),
  create: async (payload) =>
    unwrap(await apiClient.post("/users", toFormData(payload))),
  update: async (id, payload) =>
    unwrap(await apiClient.put(`/users/${id}`, toFormData(payload))),
  remove: async (id) => unwrap(await apiClient.delete(`/users/${id}`)),
};
