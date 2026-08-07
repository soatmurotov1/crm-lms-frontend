import { apiClient } from "./client";

const unwrap = (response) => response?.data;
const API_CACHE_PREFIX = "crm_api_cache_v1:";
const API_CACHE_TTL = 1000 * 60 * 5;

const getAuthScope = () => {
  try {
    const token = localStorage.getItem("crm_access_token") || "guest";
    return token.slice(-16);
  } catch {
    return "guest";
  }
};

const getCacheKey = (key) => `${API_CACHE_PREFIX}${getAuthScope()}:${key}`;

// Muddat yozishda saqlangani uchun o'qishda `ttl` kerak emas.
const readCache = (key) => {
  try {
    const raw = localStorage.getItem(getCacheKey(key));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    const expiresAt = Number(parsed.expiresAt || 0);
    if (!expiresAt || Date.now() > expiresAt) {
      localStorage.removeItem(getCacheKey(key));
      return null;
    }

    return parsed.value;
  } catch {
    return null;
  }
};

const writeCache = (key, value, ttl = API_CACHE_TTL) => {
  try {
    localStorage.setItem(
      getCacheKey(key),
      JSON.stringify({
        value,
        expiresAt: Date.now() + ttl,
      }),
    );
  } catch {
    // Ignore storage errors and keep app usable.
  }
};

const clearApiCache = () => {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(API_CACHE_PREFIX))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // Ignore storage errors and keep app usable.
  }
};

const cachedGet = async (key, request, ttl = API_CACHE_TTL) => {
  const cached = readCache(key);
  if (cached !== null) {
    return cached;
  }

  const fresh = await request();
  writeCache(key, fresh, ttl);
  return fresh;
};

const withCacheInvalidation = async (mutationRequest) => {
  const result = await mutationRequest();
  clearApiCache();
  return result;
};

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

/**
 * 404 ikki xil bo'ladi va ularni farqlash shart:
 *
 *  - Nest marshrutni topmasa: `Cannot POST /auth/forgot-password` (eski deploy);
 *  - Servis "topilmadi" desa: masalan "Bu telefon raqami ro'yxatdan o'tmagan".
 *
 * Ikkinchisi — foydalanuvchiga aytilishi kerak bo'lgan haqiqiy javob. Uni
 * "endpoint yo'q" deb tushunsak, xabar yo'qoladi va foydalanuvchi sababini
 * bilmay qoladi.
 */
export const isMissingEndpointError = (error) => {
  if (error?.response?.status !== 404) return false;

  const message = error.response.data?.message;
  const text = Array.isArray(message) ? message[0] : message;

  // Xabar bo'lmasa ham marshrut yo'q deb hisoblaymiz (proxy 404 qaytargan).
  if (!text) return true;

  return /^Cannot\s+(GET|POST|PUT|PATCH|DELETE)\b/i.test(String(text));
};

/**
 * Yangi endpoint serverda hali yo'q bo'lsa (eski deploy), eskisiga qaytadi.
 * Servisning o'z "topilmadi" xatosi esa o'z holicha yuqoriga o'tadi.
 */
const withLegacyFallback = async (request, legacyRequest) => {
  try {
    return unwrap(await request());
  } catch (error) {
    if (!isMissingEndpointError(error)) throw error;
    return unwrap(await legacyRequest());
  }
};

export const authApi = {
  loginAdmin: async (payload) => {
    return unwrap(await apiClient.post("/auth/login/admin", payload));
  },
  loginTeacher: async (payload) => {
    return unwrap(await apiClient.post("/auth/login/teacher", payload));
  },
  loginStudent: async (payload) => {
    return unwrap(await apiClient.post("/auth/login/student", payload));
  },
  register: async (payload) => {
    return unwrap(await apiClient.post("/auth/register", payload));
  },
  /** Telefon raqamiga 6 xonali SMS kod yuboradi. */
  sendCode: async (phone, purpose = "REGISTER") => {
    return unwrap(await apiClient.post("/auth/send-code", { phone, purpose }));
  },
  /** Kodni tekshiradi (tasdiqlangan kod 15 daqiqa amal qiladi). */
  verifyCode: async (phone, code, purpose = "REGISTER") => {
    return unwrap(
      await apiClient.post("/auth/verify-code", { phone, code, purpose }),
    );
  },
  /**
   * Parolni unutgan foydalanuvchining raqamiga tiklash kodini yuboradi.
   *
   * Serverda `forgot-password` bo'lmasa (eski deploy 404 qaytaradi), o'sha
   * ishni bajaradigan eski yo'l — `send-code` + `RESET_PASSWORD` — ishlatiladi.
   */
  forgotPassword: async (phone) => {
    return withLegacyFallback(
      () => apiClient.post("/auth/forgot-password", { phone }),
      () =>
        apiClient.post("/auth/send-code", {
          phone,
          purpose: "RESET_PASSWORD",
        }),
    );
  },
  /** SMS kod bilan yangi parol o'rnatadi. */
  resetPassword: async ({ phone, code, password }) => {
    return withLegacyFallback(
      () => apiClient.post("/auth/reset-password", { phone, code, password }),
      () => apiClient.post("/auth/set-password", { phone, code, password }),
    );
  },
};

export const teachersApi = {
  getAll: async () =>
    cachedGet("teachers/all", async () =>
      unwrap(await apiClient.get("/teachers/all")),
    ),
  getMyProfile: async () => unwrap(await apiClient.get("/teachers/my/profile")),
  create: async (payload) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.post("/teachers", toFormData(payload))),
    ),
  update: async (id, payload) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.put(`/teachers/${id}`, toFormData(payload))),
    ),
  remove: async (id) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.delete(`/teachers/${id}`)),
    ),
  toggleArchive: async (id) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.put(`/teachers/${id}/archive`)),
    ),
  changeMyPassword: async (payload) =>
    unwrap(await apiClient.put("/teachers/my/password", payload)),
};

export const studentsApi = {
  getAll: async () =>
    cachedGet("students/all", async () =>
      unwrap(await apiClient.get("/students/all")),
    ),
  getMyProfile: async () => unwrap(await apiClient.get("/students/my/profile")),
  getMyGroups: async () => unwrap(await apiClient.get("/students/my/groups")),
  getMonthlyList: async (params = {}) =>
    unwrap(
      await apiClient.get("/payments/admin/monthly", {
        params,
      }),
    ),
  getMyLessons: async (groupId) =>
    unwrap(await apiClient.get(`/students/my/lessons/${groupId}`)),
  getMyGroupLessonVideo: async (groupId) =>
    unwrap(await apiClient.get(`/students/my/group/lessonVideo/${groupId}`)),
  getMyGroupHomework: async (groupId, lessonId) =>
    unwrap(
      await apiClient.get(`/students/my/group/homework/${groupId}`, {
        params: { lessonId },
      }),
    ),
  changeMyPassword: async (payload) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.put("/students/my/password", payload)),
    ),
  create: async (payload) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.post("/students", toFormData(payload))),
    ),
  update: async (id, payload) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.put(`/students/${id}`, toFormData(payload))),
    ),
  remove: async (id) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.delete(`/students/${id}`)),
    ),
};

export const roomsApi = {
  getAll: async () =>
    cachedGet("rooms/all", async () =>
      unwrap(await apiClient.get("/rooms/all")),
    ),
  create: async (payload) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.post("/rooms", payload)),
    ),
  update: async (id, payload) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.put(`/rooms/${id}`, payload)),
    ),
  remove: async (id) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.delete(`/rooms/${id}`)),
    ),
};

export const coursesApi = {
  getAll: async () =>
    cachedGet("course/all", async () =>
      unwrap(await apiClient.get("/course/all")),
    ),
  create: async (payload) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.post("/course", payload)),
    ),
  update: async (id, payload) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.put(`/course/${id}`, payload)),
    ),
  remove: async (id) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.delete(`/course/${id}`)),
    ),
};

export const groupsApi = {
  getAll: async (options = {}) => {
    const status =
      typeof options === "string"
        ? options
        : String(options?.status || "").trim();

    const cacheKey = `groups/all:${status || "ACTIVE"}`;
    const requestConfig = status
      ? {
          params: {
            status,
          },
        }
      : undefined;

    return cachedGet(cacheKey, async () =>
      unwrap(await apiClient.get("/groups/all", requestConfig)),
    );
  },
  getStudentsByGroup: async (groupId) =>
    cachedGet(`groups/students/${groupId}`, async () =>
      unwrap(await apiClient.get(`/groups/students/${groupId}`)),
    ),
  getLessonsByGroup: async (groupId) =>
    cachedGet(`groups/lesson/${groupId}`, async () =>
      unwrap(await apiClient.get(`/groups/lesson/${groupId}`)),
    ),
  create: async (payload) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.post("/groups", payload)),
    ),
  update: async (id, payload) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.put(`/groups/${id}`, payload)),
    ),
  remove: async (id) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.delete(`/groups/${id}`)),
    ),
};

export const paymentsApi = {
  getMonthlySummary: async (params = {}) =>
    unwrap(
      await apiClient.get("/payments/summary/monthly", {
        params,
      }),
    ),
  getYearlySummary: async (params = {}) =>
    unwrap(
      await apiClient.get("/payments/summary/yearly", {
        params,
      }),
    ),
  getMonthlyList: async (params = {}) =>
    unwrap(
      await apiClient.get("/payments/admin/monthly", {
        params,
      }),
    ),
  getStudentMonthly: async (studentId, params = {}) =>
    unwrap(
      await apiClient.get(`/payments/students/${studentId}/monthly`, {
        params,
      }),
    ),
  startStudentPayment: async (studentId, payload) =>
    unwrap(
      await apiClient.post(`/payments/students/${studentId}/start`, payload),
    ),
  markPaid: async (paymentId, payload = {}) =>
    unwrap(await apiClient.patch(`/payments/${paymentId}/mark-paid`, payload)),
  updateStatus: async (paymentId, payload) =>
    unwrap(await apiClient.patch(`/payments/${paymentId}/status`, payload)),
};

export const studentGroupApi = {
  create: async (payload) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.post("/student-group", payload)),
    ),
  remove: async (payload) =>
    withCacheInvalidation(async () =>
      unwrap(
        await apiClient.delete("/student-group", {
          data: payload,
        }),
      ),
    ),
};

export const attendanceApi = {
  getByLesson: async (lessonId) =>
    unwrap(await apiClient.get(`/attendance/${lessonId}`)),
  getWeeklyStats: async (params = {}) =>
    unwrap(await apiClient.get("/attendance/stats/weekly", { params })),
  create: async (payload) => {
    console.log("attendanceApi.create called with payload:", payload);
    try {
      const response = await apiClient.post("/attendance", payload);
      console.log("attendanceApi.create response:", response);
      const result = unwrap(response);
      clearApiCache(); // Invalidate cache after successful creation
      return result;
    } catch (err) {
      console.error("attendanceApi.create error:", {
        message: err.message,
        url: err.config?.url,
        method: err.config?.method,
        data: err.config?.data,
        status: err.response?.status,
        response: err.response?.data,
      });
      throw err;
    }
  },
  update: async (payload) => {
    console.log("attendanceApi.update called with payload:", payload);
    try {
      const response = await apiClient.put("/attendance", payload);
      console.log("attendanceApi.update response:", response);
      const result = unwrap(response);
      clearApiCache(); // Invalidate cache after successful update
      return result;
    } catch (err) {
      console.error("attendanceApi.update error:", {
        message: err.message,
        url: err.config?.url,
        method: err.config?.method,
        data: err.config?.data,
        status: err.response?.status,
        response: err.response?.data,
      });
      throw err;
    }
  },
};

export const lessonsApi = {
  getByGroup: async (groupId) =>
    unwrap(await apiClient.get(`/lessons/group/${groupId}`)),
  create: async (payload) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.post("/lessons", payload)),
    ),
  update: async (groupId, lessonId, payload) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.put(`/lessons/${groupId}/${lessonId}`, payload)),
    ),
};

export const homeworkApi = {
  getByGroup: async (groupId) =>
    cachedGet(`homework/group/${groupId}`, async () =>
      unwrap(await apiClient.get(`/homework/group/${groupId}`)),
    ),
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
    withCacheInvalidation(async () =>
      unwrap(await apiClient.post("/homework", toFormData(payload))),
    ),
  remove: async (id) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.delete(`/homework/${id}`)),
    ),
};

export const homeworkResultsApi = {
  getMine: async (homeworkId) =>
    unwrap(await apiClient.get(`/homework-results/mine/${homeworkId}`)),
  create: async (payload) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.post("/homework-results", payload)),
    ),
  update: async (id, payload) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.put(`/homework-results/${id}`, payload)),
    ),
};

export const homeworkResponseApi = {
  getMine: async (homeworkId) =>
    unwrap(await apiClient.get(`/homework-response/mine/${homeworkId}`)),
  getByStudent: async (homeworkId, studentId) =>
    unwrap(
      await apiClient.get(
        `/homework-response/homework/${homeworkId}/student/${studentId}`,
      ),
    ),
  create: async (payload) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.post("/homework-response", toFormData(payload))),
    ),
  update: async (payload) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.put("/homework-response", toFormData(payload))),
    ),
};

export const examsApi = {
  getByGroup: async (groupId) =>
    cachedGet(`exams/group/${groupId}`, async () =>
      unwrap(await apiClient.get(`/exams/group/${groupId}`)),
    ),
  getById: async (examId) => unwrap(await apiClient.get(`/exams/${examId}`)),
  create: async (payload) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.post("/exams", toFormData(payload))),
    ),
  update: async (examId, payload) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.patch(`/exams/${examId}`, toFormData(payload))),
    ),
  remove: async (examId) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.delete(`/exams/${examId}`)),
    ),
  submitResponse: async (payload) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.post("/exams/response", toFormData(payload))),
    ),
  updateResponse: async (payload) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.put("/exams/response", toFormData(payload))),
    ),
  getMyResponse: async (examId) =>
    unwrap(await apiClient.get(`/exams/response/mine/${examId}`)),
  getStudentResponse: async (examId, studentId) =>
    unwrap(
      await apiClient.get(`/exams/response/${examId}/student/${studentId}`),
    ),
};

export const lessonVideosApi = {
  getByGroup: async (groupId) =>
    unwrap(await apiClient.get(`/lesson-videos/${groupId}`)),
  create: async (payload) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.post("/lesson-videos", toFormData(payload))),
    ),
  remove: async (id) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.delete(`/lesson-videos/${id}`)),
    ),
};

export const organizationsApi = {
  getAll: async (status) =>
    cachedGet(`organizations/all:${status || "ALL"}`, async () =>
      unwrap(
        await apiClient.get("/organizations/all", {
          params: status ? { status } : undefined,
        }),
      ),
    ),
  getOne: async (id) => unwrap(await apiClient.get(`/organizations/${id}`)),
  create: async (payload) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.post("/organizations", payload)),
    ),
  update: async (id, payload) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.put(`/organizations/${id}`, payload)),
    ),
  remove: async (id) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.delete(`/organizations/${id}`)),
    ),
};

export const plansApi = {
  getAll: async (status) =>
    cachedGet(`plans/all:${status || "ALL"}`, async () =>
      unwrap(
        await apiClient.get("/plans/all", {
          params: status ? { status } : undefined,
        }),
      ),
    ),
  getOne: async (id) => unwrap(await apiClient.get(`/plans/${id}`)),
  create: async (payload) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.post("/plans", payload)),
    ),
  update: async (id, payload) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.put(`/plans/${id}`, payload)),
    ),
  remove: async (id) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.delete(`/plans/${id}`)),
    ),
};

export const subscriptionsApi = {
  getAll: async (params = {}) =>
    unwrap(await apiClient.get("/subscriptions/all", { params })),
  getSummary: async () => unwrap(await apiClient.get("/subscriptions/summary")),
  create: async (payload) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.post("/subscriptions", payload)),
    ),
  update: async (id, payload) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.put(`/subscriptions/${id}`, payload)),
    ),
  remove: async (id) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.delete(`/subscriptions/${id}`)),
    ),
};

export const supportApi = {
  getAll: async (status) =>
    unwrap(
      await apiClient.get("/support/all", {
        params: status ? { status } : undefined,
      }),
    ),
  getSummary: async () => unwrap(await apiClient.get("/support/summary")),
  getOne: async (id) => unwrap(await apiClient.get(`/support/${id}`)),
  create: async (payload) =>
    unwrap(await apiClient.post("/support", payload)),
  reply: async (id, payload) =>
    unwrap(await apiClient.post(`/support/${id}/reply`, payload)),
  update: async (id, payload) =>
    unwrap(await apiClient.patch(`/support/${id}`, payload)),
  remove: async (id) => unwrap(await apiClient.delete(`/support/${id}`)),
};

export const notificationsApi = {
  getMine: async (limit) =>
    unwrap(
      await apiClient.get("/notifications/mine", {
        params: limit ? { limit } : undefined,
      }),
    ),
  getAll: async (limit) =>
    unwrap(
      await apiClient.get("/notifications/all", {
        params: limit ? { limit } : undefined,
      }),
    ),
  create: async (payload) =>
    unwrap(await apiClient.post("/notifications", payload)),
  markAsRead: async (id) =>
    unwrap(await apiClient.patch(`/notifications/${id}/read`)),
  markAllAsRead: async () =>
    unwrap(await apiClient.patch("/notifications/read/all")),
  remove: async (id) => unwrap(await apiClient.delete(`/notifications/${id}`)),
};

export const gradesApi = {
  getMine: async () => unwrap(await apiClient.get("/grades/mine")),
  getByGroup: async (groupId) =>
    unwrap(await apiClient.get(`/grades/group/${groupId}`)),
  getByStudent: async (studentId) =>
    unwrap(await apiClient.get(`/grades/student/${studentId}`)),
  create: async (payload) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.post("/grades", payload)),
    ),
  update: async (id, payload) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.put(`/grades/${id}`, payload)),
    ),
  remove: async (id) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.delete(`/grades/${id}`)),
    ),
};

export const usersApi = {
  getAll: async () =>
    cachedGet("users/all", async () => unwrap(await apiClient.get("/users"))),
  create: async (payload) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.post("/users", toFormData(payload))),
    ),
  update: async (id, payload) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.put(`/users/${id}`, toFormData(payload))),
    ),
  remove: async (id) =>
    withCacheInvalidation(async () =>
      unwrap(await apiClient.delete(`/users/${id}`)),
    ),
};
