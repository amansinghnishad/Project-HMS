import { apiClient, safeParams } from "./client";

const BASE_PATH = "/allotment";

export const allotmentService = {
  triggerAllotment: () => apiClient("POST", `${BASE_PATH}/allot-rooms`),

  fetchRoomAvailability: () => apiClient("GET", `${BASE_PATH}/availability`),

  fetchAllottedStudents: (params) =>
    apiClient("GET", `${BASE_PATH}/allotted-students`, { params: safeParams(params) }),
};
