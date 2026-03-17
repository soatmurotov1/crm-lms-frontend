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
  update: async (id, payload) =>
    unwrap(await apiClient.put(`/students/${id}`, toFormData(payload))),
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
  getLessonsByGroup: async (groupId) =>
    unwrap(await apiClient.get(`/groups/lesson/${groupId}`)),
  create: async (payload) => unwrap(await apiClient.post("/groups", payload)),
  update: async (id, payload) =>
    unwrap(await apiClient.put(`/groups/${id}`, payload)),
  remove: async (id) => unwrap(await apiClient.delete(`/groups/${id}`)),
};

export const attendanceApi = {
  getByLesson: async (lessonId) =>
    unwrap(await apiClient.get(`/attendance/${lessonId}`)),
  create: async (payload) =>
    unwrap(await apiClient.post("/attendance", payload)),
  update: async (payload) =>
    unwrap(await apiClient.put("/attendance", payload)),
};

export const lessonsApi = {
  getByGroup: async (groupId) =>
    unwrap(await apiClient.get(`/lessons/group/${groupId}`)),
};

export const homeworkApi = {
  getByGroup: async (groupId) =>
    unwrap(await apiClient.get(`/homework/group/${groupId}`)),
  getByStatus: async (homeworkId, status) =>
    unwrap(
      await apiClient.get(`/homework/${homeworkId}`, { params: { status } }),
    ),
  getStatuses: async (homeworkId) => {
    const statuses = ["PENDING", "APPROVED", "REJECTED", "NOT_REVIEWED"];
    const results = await Promise.allSettled(
      statuses.map((status) => homeworkApi.getByStatus(homeworkId, status)),
    );

    return statuses.reduce((acc, status, index) => {
      const response = results[index];
      acc[status] =
        response.status === "fulfilled" && Array.isArray(response.value?.data)
          ? response.value.data
          : [];
      return acc;
    }, {});
  },
  create: async (payload) =>
    unwrap(await apiClient.post("/homework", toFormData(payload))),
  remove: async (id) => unwrap(await apiClient.delete(`/homework/${id}`)),
};

export const lessonVideosApi = {
  getByGroup: async (groupId) =>
    unwrap(await apiClient.get(`/lesson-videos/${groupId}`)),
  create: async (payload) =>
    unwrap(await apiClient.post("/lesson-videos", toFormData(payload))),
};

export const usersApi = {
  getAll: async () => unwrap(await apiClient.get("/users")),
  create: async (payload) =>
    unwrap(await apiClient.post("/users", toFormData(payload))),
  update: async (id, payload) =>
    unwrap(await apiClient.put(`/users/${id}`, toFormData(payload))),
  remove: async (id) => unwrap(await apiClient.delete(`/users/${id}`)),
};
