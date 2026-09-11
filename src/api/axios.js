import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ?? '/api/v1';
const TOKEN_KEY = 'dynamodesk_token';

// Long enough to cover a cold start plus a slow PDF render. Without it axios
// waits forever and a dropped connection never surfaces as an error.
export const api = axios.create({ baseURL: API_URL, withCredentials: true, timeout: 90_000 });

// ---------------------------------------------------------------------------
// Cold starts
//
// Render's free plan spins the service down after ~15 minutes idle. The next
// request pays for a container boot: usually 30-60s of silence, sometimes a
// 502/503/504 from Render's router when the boot outruns its patience. Neither
// is a real failure, so we tell the UI the server is waking and retry a few
// times instead of showing the user a network error.
// ---------------------------------------------------------------------------

const SLOW_REQUEST_MS = 4_000; // past this, assume a sleeping server, not a slow one
const RETRY_DELAYS_MS = [3_000, 6_000, 10_000];
const COLD_START_STATUSES = new Set([502, 503, 504]);

const slowTimers = new Map(); // per attempt: config -> timer
const slowAttempts = new Set(); // attempts that outran SLOW_REQUEST_MS
const wakingListeners = new Set();
let retryChains = 0; // retry sequences in flight, each spanning several attempts
let waking = false;

// A retry re-enters axios with a fresh config object, so the notice cannot be
// tied to one config's identity — the retry chain owns it for its whole run.
const refreshWaking = () => {
  const next = retryChains > 0 || slowAttempts.size > 0;
  if (waking === next) return;
  waking = next;
  wakingListeners.forEach((listener) => listener(waking));
};

/** Subscribe to "the API is waking up" changes. Returns an unsubscribe fn. */
export const subscribeWaking = (listener) => {
  wakingListeners.add(listener);
  return () => {
    wakingListeners.delete(listener);
  };
};

export const isWaking = () => waking;

const startSlowTimer = (config) => {
  slowTimers.set(
    config,
    setTimeout(() => {
      slowAttempts.add(config);
      refreshWaking();
    }, SLOW_REQUEST_MS),
  );
};

const stopSlowTimer = (config) => {
  clearTimeout(slowTimers.get(config));
  slowTimers.delete(config);
  slowAttempts.delete(config);
  refreshWaking();
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * A blob request (the PDF download) gets its error body as a Blob too, so the
 * server's { success, message } never reaches the code below and every failure
 * reads "Request failed with status code 500". Read the blob back into JSON.
 */
const readBlobError = async (error) => {
  const data = error.response?.data;
  if (typeof Blob === 'undefined' || !(data instanceof Blob)) return null;
  if (data.type && !data.type.includes('json')) return null;
  try {
    return JSON.parse(await data.text());
  } catch {
    return null;
  }
};

/** Turn axios' generic "Network Error" into something a user can act on. */
const describeFailure = (error) => {
  if (error.response) {
    if (COLD_START_STATUSES.has(error.response.status)) {
      return 'The server is not responding yet. It may still be starting up — try again in a moment.';
    }
    return error.message ?? 'Request failed';
  }
  if (error.code === 'ECONNABORTED') {
    return 'The server took too long to respond. It may still be starting up — try again in a moment.';
  }
  return 'Could not reach the server. It may be starting up — try again in a moment.';
};

/**
 * A cold start looks like either no response at all or a gateway error. A
 * timed-out write may already have landed on the server, so only reads and
 * login — which is safe to repeat — are retried in that case.
 */
const isColdStart = (error) => {
  if (error.code === 'ERR_CANCELED') return false;

  // A gateway error is not proof the request was refused: Render's router also
  // returns one when the request DID reach a booting container and outran the
  // router's patience. Replaying a write in that case applies it twice, so only
  // requests that are safe to repeat are ever retried — whether the failure came
  // back as a gateway status or as no response at all.
  const method = (error.config?.method ?? 'get').toLowerCase();
  const isReplayable = method === 'get' || error.config?.url?.includes('/auth/login');
  if (!isReplayable) return false;

  if (error.response) return COLD_START_STATUSES.has(error.response.status);
  return true;
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  startSlowTimer(config);
  return config;
});

/** Anything the AuthProvider needs to know about a dead session arrives here. */
let onUnauthorized = null;
export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

// The server always answers { success, message, data }.
api.interceptors.response.use(
  (response) => {
    stopSlowTimer(response.config);
    return response;
  },
  async (error) => {
    const config = error.config;

    if (config && isColdStart(error)) {
      const attempt = config.__coldStartAttempt ?? 0;
      if (attempt < RETRY_DELAYS_MS.length) {
        config.__coldStartAttempt = attempt + 1;
        stopSlowTimer(config);
        retryChains += 1; // the server is asleep; hold the notice up until it answers
        refreshWaking();
        try {
          await sleep(RETRY_DELAYS_MS[attempt]);
          return await api(config);
        } finally {
          retryChains -= 1;
          refreshWaking();
        }
      }
    }

    if (config) stopSlowTimer(config);

    const payload = (await readBlobError(error)) ?? error.response?.data;
    const isLoginAttempt = config?.url?.includes('/auth/login');

    if (error.response?.status === 401 && !isLoginAttempt) {
      clearToken();
      onUnauthorized?.();
    }

    return Promise.reject(
      Object.assign(error, {
        message: payload?.message ?? describeFailure(error),
        details: payload?.details ?? null,
        status: error.response?.status ?? null,
        isOffline: !error.response,
      }),
    );
  },
);

export const unwrap = (response) => response.data?.data;

/** Server origin, for files it serves outside /api/v1 (uploaded logos). */
export const serverOrigin = API_URL.replace(/\/api\/v\d+\/?$/, '');

export const fileUrl = (relativePath) =>
  relativePath ? `${serverOrigin}${relativePath}` : '';
