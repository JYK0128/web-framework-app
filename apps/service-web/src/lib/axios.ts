import { ApplicationError } from '@pkg/shared/common';
import { API_BASE_PATH } from '@pkg/shared/config';
import { createIsomorphicFn } from '@tanstack/react-start';
import { getRequest, getResponseHeaders } from '@tanstack/react-start/server';
import Axios, { AxiosHeaders, type AxiosHeaderValue, type AxiosInstance, type AxiosRequestConfig, isAxiosError } from 'axios';
import { toast } from 'sonner';

import type { ApiErrorResponseDto } from '#/.generated/api/model/apiErrorResponseDto';
import type { AuthControllerRefreshV1200 } from '#/.generated/api/model/authControllerRefreshV1200';
import { SILENT_QUERY_PATHS } from '#/configs/app.config';
import { getI18n } from '#/core/isomorphic/i18n';
import { tokenStorage } from '#/store/token';

type ApiResult<T> = T extends { data?: infer D } ? D : T;
type AxiosFunction = <T>(config: AxiosRequestConfig, options?: AxiosRequestConfig) => Promise<ApiResult<T>>;
type RetryRequest = AxiosRequestConfig & { _retry?: boolean };
type RefreshState = {
  isRefreshing: boolean
  subscribers: { resolve: (token: string) => void, reject: (error: unknown) => void }[]
};

const AUTH_TOKEN_RESPONSE_PATHS = [
  `${API_BASE_PATH}/auth/login`,
  `${API_BASE_PATH}/auth/login/2fa`,
  `${API_BASE_PATH}/auth/refresh`,
];
const AUTH_NO_REFRESH_PATHS = [...AUTH_TOKEN_RESPONSE_PATHS, `${API_BASE_PATH}/auth/logout`];

async function refreshAndRetry(client: AxiosInstance, originalRequest: RetryRequest, refresh: RefreshState, currentToken?: string | null) {
  originalRequest._retry = true;
  const headers = AxiosHeaders.from(originalRequest.headers as unknown as Record<string, AxiosHeaderValue> | undefined);
  let token = currentToken;
  if (token && headers.get('Authorization') !== `Bearer ${token}`) {
    headers.set('Authorization', `Bearer ${token}`);
    return client({ ...originalRequest, headers });
  }
  if (refresh.isRefreshing) {
    token = await new Promise<string>((resolve, reject) => {
      refresh.subscribers.push({ resolve, reject });
    });
  }
  else {
    refresh.isRefreshing = true;
    try {
      const response = await client<AuthControllerRefreshV1200>({ url: `${API_BASE_PATH}/auth/refresh`, method: 'post', data: {} });
      token = response.data.data.accessToken;
      if (!token) throw new ApplicationError({ code: 'AUTH_REFRESH_FAILED', status: 502 });
      for (const subscriber of refresh.subscribers) subscriber.resolve(token);
    }
    catch (error) {
      for (const subscriber of refresh.subscribers) subscriber.reject(error);
      throw error;
    }
    finally {
      refresh.isRefreshing = false;
      refresh.subscribers = [];
    }
  }
  headers.set('Authorization', `Bearer ${token}`);
  return client({ ...originalRequest, headers });
}

function handleResponseError(error: unknown, client: AxiosInstance, refresh: RefreshState, token?: string | null, canRefresh = true) {
  if (error instanceof Error && Axios.isCancel(error)) throw error;
  if (!isAxiosError(error)) {
    if (error instanceof Error) throw error;
    throw new Error(String(error));
  }
  const originalRequest = error.config as RetryRequest | undefined;
  const path = new URL(originalRequest?.url ?? '', 'http://localhost').pathname;
  if (canRefresh && error.response?.status === 401 && originalRequest
    && !originalRequest._retry && !AUTH_NO_REFRESH_PATHS.includes(path)) {
    return refreshAndRetry(client, originalRequest, refresh, token);
  }
  const body = error.response?.data as ApiErrorResponseDto | undefined;
  throw new ApplicationError({
    code: body?.errorCode ?? 'API_REQUEST_FAILED',
    status: body?.statusCode ?? error.response?.status,
    details: body?.details,
    params: body?.meta?.params as Record<string, unknown> | undefined,
  });
}

const serverClients = new WeakMap<Request, AxiosInstance>();
const browserClient = Axios.create({ withCredentials: true });
const browserRefresh: RefreshState = { isRefreshing: false, subscribers: [] };

browserClient.interceptors.request.use((config) => {
  if (!config.headers.has('accept-language')) {
    const i18n = getI18n();
    config.headers.set('accept-language', i18n.resolvedLanguage ?? i18n.language);
  }
  const token = tokenStorage.getAccessToken();
  if (token && !config.headers.has('Authorization')) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});
browserClient.interceptors.response.use(
  (response) => {
    const path = new URL(response.config.url ?? '', 'http://localhost').pathname;
    if (AUTH_TOKEN_RESPONSE_PATHS.includes(path)) {
      const body = response.data as { data?: { accessToken?: unknown } } | undefined;
      const token = body?.data?.accessToken;
      if (typeof token === 'string' && token) tokenStorage.setAccessToken(token);
    }
    else if (path === `${API_BASE_PATH}/auth/logout`) tokenStorage.clear();
    return response;
  },
  (error: unknown) => {
    if (isAxiosError(error) && error.response?.status === 401 && error.config?.url === `${API_BASE_PATH}/auth/refresh`) tokenStorage.clear();
    return handleResponseError(error, browserClient, browserRefresh, tokenStorage.getAccessToken());
  },
);

export const axios = createIsomorphicFn()
  .server(async <T>(config: AxiosRequestConfig, options?: AxiosRequestConfig): Promise<ApiResult<T>> => {
    const request = getRequest();
    let client = serverClients.get(request);
    if (!client) {
      let accessToken: string | undefined;
      const refresh: RefreshState = { isRefreshing: false, subscribers: [] };
      const i18n = getI18n();
      const serverClient = Axios.create({
        baseURL: new URL(request.url).origin,
        headers: {
          'cookie': request.headers.get('cookie') ?? undefined,
          'user-agent': request.headers.get('user-agent') ?? undefined,
          'accept-language': i18n.resolvedLanguage ?? i18n.language,
        },
      });
      serverClient.interceptors.request.use((config) => {
        if (accessToken && !config.headers.has('Authorization')) config.headers.set('Authorization', `Bearer ${accessToken}`);
        return config;
      });
      serverClient.interceptors.response.use(
        (response) => {
          const cookies = response.headers['set-cookie'];
          if (Array.isArray(cookies)) {
            const headers = getResponseHeaders();
            for (const cookie of cookies) headers.append('Set-Cookie', cookie);
          }
          const path = new URL(response.config.url ?? '', 'http://localhost').pathname;
          if (AUTH_TOKEN_RESPONSE_PATHS.includes(path)) {
            const body = response.data as { data?: { accessToken?: unknown } } | undefined;
            const token = body?.data?.accessToken;
            if (typeof token === 'string' && token) accessToken = token;
          }
          else if (path === `${API_BASE_PATH}/auth/logout`) accessToken = undefined;
          return response;
        },
        (error: unknown) => {
          if (isAxiosError(error)) {
            const cookies = error.response?.headers['set-cookie'];
            if (Array.isArray(cookies)) {
              const headers = getResponseHeaders();
              for (const cookie of cookies) headers.append('Set-Cookie', cookie);
            }
            if (error.response?.status === 401 && error.config?.url === `${API_BASE_PATH}/auth/refresh`) accessToken = undefined;
          }
          return handleResponseError(error, serverClient, refresh, accessToken, Boolean(request.headers.get('cookie')));
        },
      );
      client = serverClient;
      serverClients.set(request, client);
    }
    const headers = AxiosHeaders.concat(AxiosHeaders.from(config.headers as unknown as Record<string, AxiosHeaderValue> | undefined), AxiosHeaders.from(options?.headers as unknown as Record<string, AxiosHeaderValue> | undefined));
    const response = await client<T>({ ...config, ...options, headers });
    return (response.data as { data: ApiResult<T> }).data;
  })
  .client(async <T>(config: AxiosRequestConfig, options?: AxiosRequestConfig): Promise<ApiResult<T>> => {
    const headers = AxiosHeaders.concat(AxiosHeaders.from(config.headers as unknown as Record<string, AxiosHeaderValue> | undefined), AxiosHeaders.from(options?.headers as unknown as Record<string, AxiosHeaderValue> | undefined));
    const requestConfig = { ...config, ...options, headers };
    const path = new URL(requestConfig.url ?? '', 'http://localhost').pathname;
    const showToast = !SILENT_QUERY_PATHS.has(path);
    try {
      const response = await browserClient<T>(requestConfig);
      const body: unknown = response.data;
      if (showToast && !path.startsWith(`${API_BASE_PATH}/auth/`) && (requestConfig.method ?? 'get').toLowerCase() !== 'get'
        && typeof body === 'object' && body !== null && 'message' in body
        && typeof body.message === 'string' && body.message.trim()) toast.success(body.message);
      return (response.data as { data: ApiResult<T> }).data;
    }
    catch (error) {
      const hasValidationDetails = error instanceof ApplicationError && Array.isArray(error.details);
      let displayMessage = error instanceof Error ? error.message : undefined;
      if (error instanceof ApplicationError) displayMessage = error.translate(getI18n());
      if (showToast && !Axios.isCancel(error) && !hasValidationDetails && displayMessage) toast.error(displayMessage);
      throw error;
    }
  }) as AxiosFunction;

export default axios;
