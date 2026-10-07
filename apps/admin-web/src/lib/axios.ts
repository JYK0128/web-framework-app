import { ApplicationError } from '@pkg/shared/common';
import { API_BASE_PATH } from '@pkg/shared/config';
import { createIsomorphicFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import Axios, { AxiosHeaders, type AxiosHeaderValue, type AxiosRequestConfig, isAxiosError } from 'axios';
import { toast } from 'sonner';

import type { ApiErrorResponseDto } from '#/.generated/api/model/apiErrorResponseDto';
import type { AuthControllerRefreshV1200 } from '#/.generated/api/model/authControllerRefreshV1200';
import { SILENT_QUERY_PATHS } from '#/configs/app.config';
import { getI18n } from '#/core/isomorphic/i18n';
import { tokenStorage } from '#/store/token';

type ApiResult<T> = T extends { data?: infer D } ? D : T;

const DEFAULT_RETRY_COUNT = 1;

const AUTH_TOKEN_RESPONSE_PATHS: string[] = [
  `${API_BASE_PATH}/auth/login`,
  `${API_BASE_PATH}/auth/login/2fa`,
  `${API_BASE_PATH}/auth/refresh`,
];

const AUTH_NO_REFRESH_PATHS: string[] = [
  `${API_BASE_PATH}/auth/login`,
  `${API_BASE_PATH}/auth/login/2fa`,
  `${API_BASE_PATH}/auth/refresh`,
  `${API_BASE_PATH}/auth/logout`,
];

const AXIOS_INSTANCE = Axios.create({
  withCredentials: true,
});

type AuthState = { accessToken?: string, refreshPromise?: Promise<string> };
const browserRefresh: AuthState = {};
const serverAuth = new WeakMap<Request, AuthState>();

function getAuthState(request?: Request): AuthState {
  if (!request) return browserRefresh;
  let state = serverAuth.get(request);
  if (!state) {
    state = {};
    serverAuth.set(request, state);
  }
  return state;
}

const forwardResponseCookies = createIsomorphicFn()
  .server(async (cookies: string[]) => {
    const { getResponseHeaders } = await import('@tanstack/react-start/server');
    const headers = getResponseHeaders();
    for (const cookie of cookies) headers.append('Set-Cookie', cookie);
  })
  .client(() => undefined);

function normalizeHeaders(headers: AxiosRequestConfig['headers']): AxiosHeaders {
  return AxiosHeaders.from(headers as unknown as Record<string, AxiosHeaderValue> | undefined);
}

const getStartRequest = createIsomorphicFn()
  .server(() => getRequest())
  .client(() => undefined);

function applyStartRequest(config: AxiosRequestConfig, headers: AxiosHeaders, request?: Request): void {
  if (!request) return;
  const cookie = request.headers.get('cookie');
  if (cookie && !headers.has('cookie')) headers.set('cookie', cookie);
  const userAgent = request.headers.get('user-agent');
  if (userAgent && !headers.has('user-agent')) headers.set('user-agent', userAgent);
  if (!config.baseURL) config.baseURL = new URL(request.url).origin;
}

function applyLocaleHeader(headers: AxiosHeaders): void {
  if (headers.has('accept-language')) return;
  const i18n = getI18n();
  headers.set('accept-language', i18n.resolvedLanguage ?? i18n.language);
}

function applyAccessToken(headers: AxiosHeaders, request?: Request): void {
  const token = request ? getAuthState(request).accessToken : tokenStorage.getAccessToken();
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
}

AXIOS_INSTANCE.interceptors.request.use((config) => {
  const headers = AxiosHeaders.from(config.headers);
  const request = getStartRequest();
  applyStartRequest(config, headers, request);
  applyLocaleHeader(headers);
  applyAccessToken(headers, request);
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

async function refreshAndRetry(originalRequest: AxiosRequestConfig & { _retryCount?: number }) {
  originalRequest._retryCount = (originalRequest._retryCount ?? DEFAULT_RETRY_COUNT) - 1;
  const request = getStartRequest();
  const state = getAuthState(request);
  const currentToken = request ? state.accessToken : tokenStorage.getAccessToken();
  const requestToken = normalizeHeaders(originalRequest.headers).get('Authorization');
  if (currentToken && requestToken !== `Bearer ${currentToken}`) {
    return retryWithToken(originalRequest, currentToken);
  }

  if (!state.refreshPromise) {
    state.refreshPromise = AXIOS_INSTANCE.post<AuthControllerRefreshV1200>(
      `${API_BASE_PATH}/auth/refresh`,
      {},
    ).then((response) => {
      const accessToken = response.data.data.accessToken;
      if (!accessToken) {
        throw new ApplicationError({
          code: 'AUTH_REFRESH_FAILED',
          status: 502,
        });
      }
      return accessToken;
    })
      .catch((error: unknown) => {
        if (error instanceof ApplicationError && error.status === 401) tokenStorage.clear();
        throw error;
      })
      .finally(() => {
        state.refreshPromise = undefined;
      });
  }
  return retryWithToken(originalRequest, await state.refreshPromise);
}

AXIOS_INSTANCE.interceptors.response.use(
  async (response) => {
    if (typeof window === 'undefined') {
      const cookies = response.headers['set-cookie'];
      if (Array.isArray(cookies)) await forwardResponseCookies(cookies);
    }
    const path = new URL(response.config.url ?? '', 'http://localhost').pathname;
    if (AUTH_TOKEN_RESPONSE_PATHS.includes(path)) {
      const token = extractAccessToken(response.data);
      if (token) {
        const request = getStartRequest();
        if (request) getAuthState(request).accessToken = token;
        else tokenStorage.setAccessToken(token);
      }
    }
    else if (path === `${API_BASE_PATH}/auth/logout`) {
      const request = getStartRequest();
      if (request) getAuthState(request).accessToken = undefined;
      else tokenStorage.clear();
    }
    return response;
  },
  async (error: unknown) => {
    if (error instanceof Error && Axios.isCancel(error)) return Promise.reject(error);
    if (!isAxiosError(error)) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }

    const originalRequest = error.config as (AxiosRequestConfig & { _retryCount?: number }) | undefined;
    const path = new URL(originalRequest?.url ?? '', 'http://localhost').pathname;
    const skipRefresh = AUTH_NO_REFRESH_PATHS.includes(path);

    const request = getStartRequest();
    if (request) {
      const cookies = error.response?.headers['set-cookie'];
      if (Array.isArray(cookies)) await forwardResponseCookies(cookies);
    }
    const canRefresh = !request || Boolean(request.headers.get('cookie'));
    if (canRefresh && error.response?.status === 401 && originalRequest && (originalRequest._retryCount ?? DEFAULT_RETRY_COUNT) > 0 && !skipRefresh) {
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
