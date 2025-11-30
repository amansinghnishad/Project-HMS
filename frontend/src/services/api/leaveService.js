import { apiClient, safeParams } from "./client";

const BASE_PATH = "/leave";

export const leaveService = {
  submitLeaveRequest: (payload) =>
    apiClient("POST", `${BASE_PATH}/submit`, { data: payload }),

  fetchUserLeaveRequests: (params) =>
    apiClient("GET", BASE_PATH, { params: safeParams(params) }),

  fetchAllLeaveRequests: (params) =>
    apiClient("GET", `${BASE_PATH}/all`, { params: safeParams(params) }),

  resolveLeaveRequest: (requestId, payload) =>
    apiClient("PUT", `${BASE_PATH}/resolve/${requestId}`, { data: payload }),
};
