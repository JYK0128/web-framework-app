import { API_BASE_PATH } from '@pkg/shared/config';
import { ApplicationError } from '@pkg/shared/common';
import { getGlobalStartContext } from '@tanstack/react-start';
import Axios, { AxiosHeaders, type AxiosHeaderValue, type AxiosRequestConfig, isAxiosError } from 'axios';

import { toast } from 'sonner';

import type { ApiErrorResponseDto } from '#/.generated/api/model/apiErrorResponseDto';
import { SILENT_QUERY_PATHS } from '#/configs/app.config';
import { getI18n } from '#/core/isomorphic/i18n';
import { tokenStorage } from '#/store/token';

type ApiResult<T> = T extends { data?: infer D } ? D : T;

type StartRequestContext = {
  request?: Request
};

const AUTH_API_PREFIX = `${API_BASE_PATH}/auth/`;
const AUTH_PRINCIPAL_PATH = `${API_BASE_PATH}/auth/me`;

const AUTH_TOKEN_RESPONSE_PATHS = [
  `${API_BASE_PATH}/auth/login`,
  `${API_BASE_PATH}/auth/refresh`,
] as const;

class AuthSessionExpiredError extends ApplicationError {
  constructor() {
    super({
      code: 'AUTH_SESSION_EXPIRED',
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

function applyStartRequest(config: AxiosRequestConfig, headers: AxiosHeaders, request?: Request): void {
  if (!request) return;
  const cookie = request.headers.get('cookie');
  if (cookie && !headers.has('cookie')) headers.set('cookie', cookie);
  if (!config.baseURL) config.baseURL = new URL(request.url).origin;
}

function applyLocaleHeader(headers: AxiosHeaders): void {
  if (headers.has('accept-language')) return;
  const i18n = getI18n();
  headers.set('accept-language', i18n.resolvedLanguage ?? i18n.language);
}

function applyAccessToken(headers: AxiosHeaders): void {
  const token = tokenStorage.getAccessToken();
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
}

AXIOS_INSTANCE.interceptors.request.use((config) => {
  const headers = AxiosHeaders.from(config.headers);
  applyStartRequest(config, headers, getStartRequest());
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
    `${API_BASE_PATH}/auth/refresh`,
    {},
    { withCredentials: true },
  );
  const accessToken = extractAccessToken(refreshResponse.data);
  if (!accessToken) {
    throw new AuthSessionExpiredError();
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
    const sessionExpired = refreshErr instanceof AuthSessionExpiredError
      ? refreshErr
      : new AuthSessionExpiredError();
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
    else if (url.includes(`${API_BASE_PATH}/auth/logout`)) {
      tokenStorage.clear();
    }
    return response;
  },
  async (error: unknown) => {
    if (error instanceof Error && Axios.isCancel(error)) return Promise.reject(error);
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
        status: body?.statusCode ?? error.response?.status,
        details: body?.details,
        params: body?.meta?.params as Record<string, unknown> | undefined,
      }),
    );
  },
);

export const axios = async <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<ApiResult<T>> => {
  const headers = AxiosHeaders.concat(normalizeHeaders(config.headers), normalizeHeaders(options?.headers));

  const requestConfig = { ...config, ...options, headers };
  const path = new URL(requestConfig.url ?? '', 'http://localhost').pathname;
  const showToast = typeof window !== 'undefined' && !SILENT_QUERY_PATHS.has(path);

  try {
    const response = await AXIOS_INSTANCE<T>(requestConfig);
    const body: unknown = response.data;
    if (showToast && !path.startsWith(`${API_BASE_PATH}/auth/`) && (requestConfig.method ?? 'get').toLowerCase() !== 'get'
      && typeof body === 'object' && body !== null && 'message' in body
      && typeof body.message === 'string' && body.message.trim()) {
      toast.success(body.message);
    }
    return (response.data as { data: ApiResult<T> }).data;
  }
  catch (error) {
    const hasValidationDetails = error instanceof ApplicationError && Array.isArray(error.details);
    const message = error instanceof Error ? error.message : undefined;
    const displayMessage = error instanceof ApplicationError ? error.translate(getI18n()) : message;
    if (showToast && !Axios.isCancel(error) && !hasValidationDetails && displayMessage) toast.error(displayMessage);
    throw error;
  }
};

export default axios;
