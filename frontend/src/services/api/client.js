import { apiConnector } from "../apiconnector";

const DEFAULT_ERROR_MESSAGE = "Request failed. Please try again.";

const hasSuccessFlag = (payload) =>
  payload && typeof payload === "object" && Object.prototype.hasOwnProperty.call(payload, "success");

export const apiClient = async (
  method,
  url,
  { data = undefined, headers = undefined, params = undefined, requireSuccess = true } = {}
) => {
  const response = await apiConnector(method, url, data, headers, params);
  const payload = response?.data;

  if (!requireSuccess) {
    return payload;
  }

  if (hasSuccessFlag(payload)) {
    if (payload.success) {
      return payload;
    }

    const message = payload.message || payload.error || DEFAULT_ERROR_MESSAGE;
    const error = new Error(message);
    error.payload = payload;
    throw error;
  }

  return payload;
};

export const safeParams = (params) => {
  if (!params) {
    return undefined;
  }

  const filteredEntries = Object.entries(params).filter(([, value]) => {
    if (value === null || value === undefined) {
      return false;
    }
    if (typeof value === "string") {
      return value.trim() !== "";
    }
    return true;
  });

  return filteredEntries.length > 0 ? Object.fromEntries(filteredEntries) : undefined;
};
