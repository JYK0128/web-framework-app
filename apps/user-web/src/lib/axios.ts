import { ApplicationError } from '@pkg/shared/common';
import { getGlobalStartContext } from '@tanstack/react-start';
import Axios, { AxiosHeaders, type AxiosHeaderValue, type AxiosRequestConfig, isAxiosError } from 'axios';

import type { ApiErrorResponseDto } from '#/.generated/api/model';
import { tokenStorage } from '#/store/token';

type StartRequestContext = {
  request?: Request
};

type ServerRuntime = typeof globalThis & {
  process?: { env?: { USER_API_URL?: string } }
};

const AUTH_API_PREFIX = '/api/v1/auth/';
const AUTH_PRINCIPAL_PATH = '/api/v1/auth/me';

const AUTH_TOKEN_RESPONSE_PATHS = [
  '/api/v1/auth/login',
  '/api/v1/auth/refresh',
] as const;

class AuthSessionExpiredError extends ApplicationError {
  constructor(message = '세션이 만료되었습니다.') {
    super({
      code: 'AUTH_SESSION_EXPIRED',
      message,
      status: 401,
    });
    this.name = 'AuthSessionExpiredError';
  }
}

const AXIOS_INSTANCE = Axios.create({
  withCredentials: true,
});

type PendingRefresh = {
  resolve: (token: string) => void
  reject: (error: unknown) => void
};

let isRefreshing = false;
let pendingRefreshes: PendingRefresh[] = [];

function resolvePendingRefreshes(token: string) {
  pendingRefreshes.forEach(({ resolve }) => resolve(token));
  pendingRefreshes = [];
}

function rejectPendingRefreshes(error: unknown) {
  pendingRefreshes.forEach(({ reject }) => reject(error));
  pendingRefreshes = [];
}

function normalizeHeaders(headers: AxiosRequestConfig['headers']): AxiosHeaders {
  return AxiosHeaders.from(headers as unknown as Record<string, AxiosHeaderValue> | undefined);
}

function getStartRequest(): Request | undefined {
  const context = getGlobalStartContext() as StartRequestContext | undefined;
  return context?.request;
}

function resolveServerBaseUrl(requestUrl: string): string | undefined {
  if (/^https?:\/\//.test(requestUrl)) return new URL(requestUrl).origin;
  if (typeof window !== 'undefined') return undefined;
  return (globalThis as ServerRuntime).process?.env?.USER_API_URL ?? 'http://localhost:15000';
}

function applyStartRequest(config: AxiosRequestConfig, headers: AxiosHeaders, request?: Request): void {
  if (!request) return;
  const cookie = request.headers.get('cookie');
  if (cookie && !headers.has('cookie')) headers.set('cookie', cookie);
  if (!config.baseURL) config.baseURL = resolveServerBaseUrl(request.url);
  const locale = request.headers.get('accept-language');
  if (locale && !headers.has('accept-language')) headers.set('accept-language', locale);
}

function applyLocaleHeader(headers: AxiosHeaders): void {
  if (headers.has('accept-language')) return;
  const locale = typeof window !== 'undefined' ? localStorage.getItem('user-locale') : undefined;
  headers.set('accept-language', locale === 'en' ? 'en' : 'ko');
}

function applyAccessToken(headers: AxiosHeaders): void {
  const token = tokenStorage.getAccessToken();
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
}

AXIOS_INSTANCE.interceptors.request.use((config) => {
  const headers = AxiosHeaders.from(config.headers);
  applyStartRequest(config, headers, getStartRequest());
  if (!config.baseURL && typeof window === 'undefined') config.baseURL = resolveServerBaseUrl('');
  applyLocaleHeader(headers);
  applyAccessToken(headers);
  config.headers = headers;
  return config;
});

function extractAccessToken(data: unknown): string | undefined {
  if (typeof data === 'object' && data !== null && 'data' in data) {
    const inner = (data as { data?: unknown }).data;
    if (typeof inner === 'object' && inner !== null && 'accessToken' in inner) {
      const token = (inner as { accessToken?: unknown }).accessToken;
      if (typeof token === 'string') return token;
    }
  }
  return undefined;
}

function retryWithToken(originalRequest: AxiosRequestConfig, token: string) {
  const headers = normalizeHeaders(originalRequest.headers);
  headers.set('Authorization', `Bearer ${token}`);
  originalRequest.headers = headers;
  return AXIOS_INSTANCE(originalRequest);
}

function waitForRefresh(originalRequest: AxiosRequestConfig) {
  return new Promise((resolve, reject) => {
    pendingRefreshes.push({
      resolve: (token) => resolve(retryWithToken(originalRequest, token)),
      reject,
    });
  });
}

async function requestRefreshToken() {
  const refreshResponse = await AXIOS_INSTANCE.post<unknown>(
    '/api/v1/auth/refresh',
    {},
    { withCredentials: true },
  );
  const accessToken = extractAccessToken(refreshResponse.data);
  if (!accessToken) {
    throw new AuthSessionExpiredError('액세스 토큰을 갱신하지 못했습니다.');
  }
  return accessToken;
}

async function refreshAndRetry(originalRequest: AxiosRequestConfig & { _retry?: boolean }) {
  if (isRefreshing) return waitForRefresh(originalRequest);

  originalRequest._retry = true;
  isRefreshing = true;

  try {
    const accessToken = await requestRefreshToken();
    tokenStorage.setAccessToken(accessToken);
    resolvePendingRefreshes(accessToken);
    return retryWithToken(originalRequest, accessToken);
  }
  catch (refreshErr) {
    tokenStorage.clear();
    const refreshErrorMessage = isAxiosError(refreshErr) ? refreshErr.message : undefined;
    const sessionExpired = refreshErr instanceof AuthSessionExpiredError
      ? refreshErr
      : new AuthSessionExpiredError(refreshErrorMessage);
    rejectPendingRefreshes(sessionExpired);
    throw sessionExpired;
  }
  finally {
    isRefreshing = false;
  }
}

AXIOS_INSTANCE.interceptors.response.use(
  (response) => {
    const url = response.config.url ?? '';
    if (AUTH_TOKEN_RESPONSE_PATHS.some((path) => url.includes(path))) {
      const token = extractAccessToken(response.data);
      if (token) tokenStorage.setAccessToken(token);
    }
    else if (url.includes('/api/v1/auth/logout')) {
      tokenStorage.clear();
    }
    return response;
  },
  async (error: unknown) => {
    if (!isAxiosError(error)) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }

    const originalRequest = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    const requestUrl = originalRequest?.url ?? '';
    const isAuthEndpoint = requestUrl.includes(AUTH_API_PREFIX)
      && !requestUrl.includes(AUTH_PRINCIPAL_PATH);

    if (typeof window !== 'undefined' && error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      return refreshAndRetry(originalRequest);
    }

    const body = error.response?.data as ApiErrorResponseDto | undefined;
    return Promise.reject(
      new ApplicationError({
        code: body?.errorCode ?? 'API_REQUEST_FAILED',
        message: body?.message ?? error.message,
        status: body?.statusCode ?? error.response?.status,
        details: body?.details,
      }),
    );
  },
);

export const axios = async <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  const headers = AxiosHeaders.concat(normalizeHeaders(config.headers), normalizeHeaders(options?.headers));

  const response = await AXIOS_INSTANCE<T>({
    ...config,
    ...options,
    headers,
  });

  return response.data;
};

export default axios;
