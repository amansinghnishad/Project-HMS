import { apiClient, safeParams } from "./client";

const BASE_PATH = "/service-requests";

export const maintenanceService = {
  submitRequest: (payload) =>
    apiClient("POST", BASE_PATH, { data: payload }),

  fetchUserRequests: (params) =>
    apiClient("GET", `${BASE_PATH}/my`, { params: safeParams(params) }),

  fetchAllRequests: (params) =>
    apiClient("GET", `${BASE_PATH}/all`, { params: safeParams(params) }),

  resolveRequest: (requestId, payload) =>
    apiClient("PUT", `${BASE_PATH}/resolve/${requestId}`, { data: payload }),
};
