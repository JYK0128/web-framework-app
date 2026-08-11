import { ApplicationError } from '@pkg/shared/common';
import { createIsomorphicFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';
import Axios, { type AxiosError, AxiosHeaders, type AxiosRequestConfig } from 'axios';

import type { ApiErrorResponseDto } from '#/.generated/api/model';
import { clientEnv } from '#/core/config/client-env';

const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_STORAGE_KEY = 'csrf_token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const readServerCookie = createIsomorphicFn()
  .server(() => getRequestHeaders().get('cookie'))
  .client(() => null);

const getBaseUrl = (): string => clientEnv.API_BASE_URL;

export const AXIOS_INSTANCE = Axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
});

function readCsrfToken(): string | null {
  if (typeof window === 'undefined') return null;

  return window.sessionStorage.getItem(CSRF_TOKEN_STORAGE_KEY);
}

function saveCsrfToken(token: string): void {
  if (typeof window === 'undefined') return;

  window.sessionStorage.setItem(CSRF_TOKEN_STORAGE_KEY, token);
}

function clearCsrfToken(): void {
  if (typeof window === 'undefined') return;

  window.sessionStorage.removeItem(CSRF_TOKEN_STORAGE_KEY);
}

let csrfRefreshPromise: Promise<string | null> | null = null;

function refreshCsrfToken(): Promise<string | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (csrfRefreshPromise) return csrfRefreshPromise;

  csrfRefreshPromise = AXIOS_INSTANCE.get('/api/v1/auth/csrf')
    .then((response) => {
      const token = response.headers?.[CSRF_HEADER_NAME] as unknown;
      return typeof token === 'string' ? token : readCsrfToken();
    })
    .catch(() => null)
    .finally(() => {
      csrfRefreshPromise = null;
    });

  return csrfRefreshPromise;
}

AXIOS_INSTANCE.interceptors.request.use(async (config) => {
  const serverCookie = readServerCookie();
  if (serverCookie) {
    const headers = AxiosHeaders.from(config.headers);
    if (!headers.has('Cookie')) headers.set('Cookie', serverCookie);
    config.headers = headers;
  }

  const method = config.method?.toUpperCase() ?? 'GET';
  if (SAFE_METHODS.has(method)) return config;

  const token = readCsrfToken() ?? await refreshCsrfToken();
  if (!token) return config;

  const headers = AxiosHeaders.from(config.headers);
  if (!headers.has(CSRF_HEADER_NAME)) {
    headers.set(CSRF_HEADER_NAME, token);
    config.headers = headers;
  }

  return config;
});

AXIOS_INSTANCE.interceptors.response.use((response) => {
  const token = response.headers?.[CSRF_HEADER_NAME] as unknown;
  if (typeof token === 'string') saveCsrfToken(token);

  const requestUrl = response.config.url ?? '';
  if (requestUrl.endsWith('/api/v1/auth/logout') || requestUrl.endsWith('/api/v1/auth/unregister')) {
    clearCsrfToken();
  }

  return response;
});

export const axios = async <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  try {
    const response = await AXIOS_INSTANCE<T>({
      baseURL: getBaseUrl(),
      ...config,
      ...options,
      headers: {
        ...config.headers,
        ...options?.headers,
      },
    });

    return response.data;
  }
  catch (error) {
    const res = (error as AxiosError<ApiErrorResponseDto>).response;
    if (res?.data) {
      throw new ApplicationError({
        code: res.data.errorCode,
        message: res.data.message,
        status: res.data.statusCode,
        details: res.data.details,
      });
    }
    throw error;
  }
};

export default axios;
