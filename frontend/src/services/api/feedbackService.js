import { apiClient, safeParams } from "./client";

const BASE_PATH = "/feedback";

export const feedbackService = {
  fetchUserFeedback: (params) =>
    apiClient("GET", BASE_PATH, { params: safeParams(params) }),

  submitFeedback: (payload) =>
    apiClient("POST", `${BASE_PATH}/submit`, { data: payload }),

  fetchAllFeedback: (params) =>
    apiClient("GET", `${BASE_PATH}/all`, { params: safeParams(params) }),

  resolveFeedback: (feedbackId, payload) =>
    apiClient("PUT", `${BASE_PATH}/resolve/${feedbackId}`, { data: payload }),
};
