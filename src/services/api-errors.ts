import axios from "axios";

export const isForbidden = (error: unknown) =>
  axios.isAxiosError(error) && error.response?.status === 403;

export const isUnauthorized = (error: unknown) =>
  axios.isAxiosError(error) && error.response?.status === 401;

export const isNotFound = (error: unknown) =>
  axios.isAxiosError(error) && error.response?.status === 404;

export const getApiErrorMessage = (error: unknown, fallback = "Something went wrong. Please try again.") => {
  if (!axios.isAxiosError(error)) return fallback;

  const responseData = error.response?.data as { message?: unknown; error?: unknown } | undefined;
  const message = responseData?.message;

  if (Array.isArray(message)) return message.join(", ");
  if (typeof message === "string" && message) return message;
  if (typeof responseData?.error === "string" && responseData.error) return responseData.error;

  return error.message || fallback;
};
