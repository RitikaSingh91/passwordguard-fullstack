import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// The access token lives in memory only (never localStorage). The refresh token is an HttpOnly cookie.
let accessToken: string | null = null;
export const setAccessToken = (t: string | null) => { accessToken = t; };

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: { 'X-Requested-With': 'PasswordGuard' }, // CSRF header checked by the server
});

api.interceptors.request.use((cfg) => {
  if (accessToken) cfg.headers.Authorization = `Bearer ${accessToken}`;
  return cfg;
});

export interface User { id: string; name: string; email: string; role: 'user' | 'admin' }
interface Session { accessToken: string; user: User }

// One shared in-flight refresh: refresh tokens rotate, so two parallel refreshes (e.g. React
// StrictMode double effects) would look like token theft and revoke the session.
let inflight: Promise<Session> | null = null;
export function refreshSession(): Promise<Session> {
  inflight ??= api.post<Session>('/auth/refresh').then((r) => {
    setAccessToken(r.data.accessToken);
    return r.data;
  }).finally(() => { inflight = null; });
  return inflight;
}

api.interceptors.response.use(undefined, async (err: AxiosError) => {
  const cfg = err.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
  if (err.response?.status === 401 && cfg && !cfg._retried && !cfg.url?.startsWith('/auth/')) {
    cfg._retried = true;
    try { await refreshSession(); return api(cfg); } catch { setAccessToken(null); }
  }
  return Promise.reject(err);
});

export const errorMessage = (e: unknown): string =>
  (e as AxiosError<{ error?: string }>)?.response?.data?.error ?? 'Something went wrong. Please try again.';
