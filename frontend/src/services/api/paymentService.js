import { apiClient, safeParams } from "./client";

const BASE_PATH = "/payment";

export const paymentService = {
  createHostelFeeOrder: () =>
    apiClient("POST", `${BASE_PATH}/create-hostel-fee-order`),

  createMessFeeOrder: (payload) =>
    apiClient("POST", `${BASE_PATH}/create-mess-fee-order`, { data: payload }),

  verifyPayment: (payload) =>
    apiClient("POST", `${BASE_PATH}/verify-payment`, { data: payload }),

  fetchMyPaymentHistory: (params) =>
    apiClient("GET", `${BASE_PATH}/my-history`, { params: safeParams(params) }),

  fetchAllPayments: (params) =>
    apiClient("GET", `${BASE_PATH}/all-payments`, { params: safeParams(params) }),
};
