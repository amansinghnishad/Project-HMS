import { apiClient, safeParams } from "./client";

const BASE_PATH = "/notices";

export const noticeService = {
  sendNotice: (payload) =>
    apiClient("POST", `${BASE_PATH}/send`, { data: payload }),

  fetchSentNotices: (params) =>
    apiClient("GET", `${BASE_PATH}/sent`, { params: safeParams(params) }),

  fetchReceivedNotices: (params) =>
    apiClient("GET", `${BASE_PATH}/received`, { params: safeParams(params) }),

  markNoticeAsRead: (noticeId) =>
    apiClient("PATCH", `${BASE_PATH}/${noticeId}/read`),

  fetchNoticeStats: () => apiClient("GET", `${BASE_PATH}/stats`),

  fetchAllNotices: (params) =>
    apiClient("GET", `${BASE_PATH}/all`, { params: safeParams(params) }),
};
