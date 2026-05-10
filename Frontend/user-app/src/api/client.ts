import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
  isAxiosError,
} from 'axios';

import { getStoredToken, setStoredToken } from '../services/tokenStorage';
import { getApiBaseUrl } from '../utils/constants';

type UnauthorizedFn = () => void;

let unauthorizedHandler: UnauthorizedFn | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedFn | null): void {
  unauthorizedHandler = handler;
}

async function attachAuth(config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> {
  const token = await getStoredToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}

function unwrapMessage(error: AxiosError<{ message?: unknown; errors?: unknown }>): string | null {
  const data = error.response?.data as { message?: unknown; errors?: unknown } | undefined;
  if (!data) return null;
  if (typeof data.message === 'string' && data.message.trim()) return data.message.trim();
  if (Array.isArray(data.message)) {
    const first = data.message.find((x) => typeof x === 'string');
    if (first) return first;
  }
  if (data.errors && typeof data.errors === 'object') {
    const firstEntry = Object.values(data.errors).flat()[0];
    if (typeof firstEntry === 'string') return firstEntry;
  }
  return null;
}

export type ApiHandledError = {
  status?: number;
  message: string;
  code?: string;
};

export function normalizeApiError(error: unknown): ApiHandledError {
  if (!isAxiosError(error)) {
    return {
      message: 'Something went wrong — please try again.',
    };
  }
  if (!error.response) {
    const code = error.code;
    const offline = code === 'ERR_NETWORK' || code === 'ECONNABORTED';
    return {
      message: offline
        ? 'Cannot reach server — please check your connection.'
        : 'Request failed — please try again.',
      code,
    };
  }
  const status = error.response.status;
  const fromBody = unwrapMessage(error);
  if (status === 401) return { status, message: 'Session expired.', code: error.code };
  if (status === 409 && fromBody) return { status, message: fromBody, code: error.code };
  if (status === 404) return { status, message: fromBody ?? 'Nothing found here.', code: error.code };
  if (status === 422 && fromBody) return { status, message: fromBody, code: error.code };

  const fallback =
    fromBody ??
    (typeof status === 'number' ? `Request failed (${status}).` : 'Something went wrong — please try again.');
  return { status, message: fallback, code: error.code };
}

export const api: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 25_000,
});

api.interceptors.request.use(attachAuth, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const url = String(error.config?.url ?? '');
    const isPublicAuthCall =
      url.includes('/api/auth/users/login') || url.includes('/api/auth/users/register');
    if (status === 401 && !isPublicAuthCall) {
      await setStoredToken(null);
      unauthorizedHandler?.();
    }
    return Promise.reject(error);
  },
);
