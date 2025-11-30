import { apiClient, safeParams } from "./client";

const BASE_PATH = "/public-notices";

export const publicNoticeService = {
  createNotice: (formData) =>
    apiClient("POST", BASE_PATH, { data: formData }),

  fetchAllNotices: (params) =>
    apiClient("GET", BASE_PATH, { params: safeParams(params) }),

  fetchPublishedNotices: (params) =>
    apiClient("GET", `${BASE_PATH}/published`, { params: safeParams(params) }),

  fetchNoticeById: (noticeId) =>
    apiClient("GET", `${BASE_PATH}/${noticeId}`),

  updateNotice: (noticeId, formData) =>
    apiClient("PUT", `${BASE_PATH}/${noticeId}`, { data: formData }),

  deleteNotice: (noticeId) => apiClient("DELETE", `${BASE_PATH}/${noticeId}`),

  publishNotice: (noticeId) =>
    apiClient("PATCH", `${BASE_PATH}/${noticeId}/publish`),
};
