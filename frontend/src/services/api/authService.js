import { apiClient, safeParams } from "./client";

const BASE_PATH = "/auth";

export const authService = {
  sendOtp: (email) =>
    apiClient("POST", `${BASE_PATH}/send-otp`, { data: { email } }),

  verifyOtp: ({ email, otp }) =>
    apiClient("POST", `${BASE_PATH}/verify-otp`, { data: { email, otp } }),

  emailVerification: (payload) =>
    apiClient("POST", `${BASE_PATH}/email-verification`, { data: payload }),

  registerStudentProfile: (payload) =>
    apiClient("POST", `${BASE_PATH}/registered-student-profile`, { data: payload }),

  loginStudent: (credentials) =>
    apiClient("POST", `${BASE_PATH}/login`, { data: credentials }),

  loginProvost: (credentials) =>
    apiClient("POST", `${BASE_PATH}/login-provost`, { data: credentials }),

  loginChiefProvost: (credentials) =>
    apiClient("POST", `${BASE_PATH}/login-chief-provost`, { data: credentials }),

  checkEmail: (email) =>
    apiClient("POST", `${BASE_PATH}/check-email`, { data: { email } }),

  verificationStatus: (payload) =>
    apiClient("POST", `${BASE_PATH}/verification-status`, { data: payload }),

  logout: () => apiClient("POST", `${BASE_PATH}/logout`),

  sendResetPasswordOtp: (email) =>
    apiClient("POST", `${BASE_PATH}/send-reset-password-otp`, { data: { email } }),

  verifyResetPasswordOtp: (payload) =>
    apiClient("POST", `${BASE_PATH}/verify-reset-password-otp`, { data: payload }),

  resetPassword: (payload) =>
    apiClient("POST", `${BASE_PATH}/reset-password`, { data: payload }),

  checkEligibility: (payload) =>
    apiClient("POST", `${BASE_PATH}/check-eligibility`, { data: payload }),

  fetchRegisteredStudents: (params) =>
    apiClient("GET", `${BASE_PATH}/registered-students`, { params: safeParams(params) }),
};
