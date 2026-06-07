import axios from "axios";

export const isForbidden = (error: unknown) =>
  axios.isAxiosError(error) && error.response?.status === 403;

export const isUnauthorized = (error: unknown) =>
  axios.isAxiosError(error) && error.response?.status === 401;
