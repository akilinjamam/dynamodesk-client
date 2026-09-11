import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ?? '/api/v1';
const TOKEN_KEY = 'dynamodesk_token';

export const api = axios.create({ baseURL: API_URL, withCredentials: true });

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Anything the AuthProvider needs to know about a dead session arrives here. */
let onUnauthorized = null;
export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

// The server always answers { success, message, data }.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const payload = error.response?.data;
    const isLoginAttempt = error.config?.url?.includes('/auth/login');

    if (error.response?.status === 401 && !isLoginAttempt) {
      clearToken();
      onUnauthorized?.();
    }

    return Promise.reject(
      Object.assign(error, {
        message: payload?.message ?? error.message ?? 'Request failed',
        details: payload?.details ?? null,
        status: error.response?.status ?? null,
      }),
    );
  },
);

export const unwrap = (response) => response.data?.data;

/** Server origin, for files it serves outside /api/v1 (uploaded logos). */
export const serverOrigin = API_URL.replace(/\/api\/v\d+\/?$/, '');

export const fileUrl = (relativePath) =>
  relativePath ? `${serverOrigin}${relativePath}` : '';
