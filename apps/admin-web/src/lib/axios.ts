import { ApplicationError } from '@pkg/shared/common';
import { getGlobalStartContext } from '@tanstack/react-start';
import Axios, { AxiosHeaders, type AxiosHeaderValue, type AxiosRequestConfig, isAxiosError } from 'axios';

import type { ApiErrorResponseDto } from '#/.generated/api/model';
import { tokenStorage } from '#/store/token';

type StartRequestContext = {
  request?: Request
};

type ServerRuntime = typeof globalThis & {
  process?: { env?: { ADMIN_API_URL?: string } }
};

const AXIOS_INSTANCE = Axios.create({
  withCredentials: true,
});

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
  return (globalThis as ServerRuntime).process?.env?.ADMIN_API_URL ?? 'http://localhost:13000';
}

AXIOS_INSTANCE.interceptors.request.use((config) => {
  const request = getStartRequest();
  if (request) {
    const headers = AxiosHeaders.from(config.headers);
    const cookie = request.headers.get('cookie');
    if (cookie && !headers.has('cookie')) headers.set('cookie', cookie);
    config.headers = headers;
    if (!config.baseURL) {
      config.baseURL = resolveServerBaseUrl(request.url);
    }
  }
  if (!config.baseURL && typeof window === 'undefined') {
    config.baseURL = resolveServerBaseUrl('');
  }

  // 인메모리 accessToken 자동 주입
  const token = tokenStorage.getAccessToken();
  if (token && !config.headers.has('Authorization')) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }

  return config;
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

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

AXIOS_INSTANCE.interceptors.response.use(
  (response) => {
    const url = response.config.url ?? '';
    if (url.includes('/api/v1/auth/login') || url.includes('/api/v1/auth/refresh')) {
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
    const isAuthRefreshLoopEndpoint
      = originalRequest?.url?.includes('/api/v1/auth/refresh')
        || originalRequest?.url?.includes('/api/v1/auth/login');

    // 401 Unauthorized 발생 시, 토큰 재발급 엔드포인트가 아니고 재시도 전이면 토큰 갱신 시도
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthRefreshLoopEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshSubscribers.push((newToken) => {
            const headers = normalizeHeaders(originalRequest.headers);
            headers.set('Authorization', `Bearer ${newToken}`);
            originalRequest.headers = headers;
            resolve(AXIOS_INSTANCE(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // HttpOnly refreshToken 쿠키를 통해 새 accessToken 발급 요청
        const refreshResponse = await Axios.post<unknown>(
          '/api/v1/auth/refresh',
          {},
          { withCredentials: true },
        );

        const newAccessToken = extractAccessToken(refreshResponse.data);
        if (newAccessToken) {
          tokenStorage.setAccessToken(newAccessToken);
          onTokenRefreshed(newAccessToken);

          const headers = normalizeHeaders(originalRequest.headers);
          headers.set('Authorization', `Bearer ${newAccessToken}`);
          originalRequest.headers = headers;
          return AXIOS_INSTANCE(originalRequest);
        }
      }
      catch (refreshErr) {
        tokenStorage.clear();
        refreshSubscribers = [];
        const refreshAxiosErr = isAxiosError(refreshErr) ? refreshErr : undefined;
        return Promise.reject(
          new ApplicationError({
            code: 'AUTH_SESSION_EXPIRED',
            message: refreshAxiosErr?.message ?? '세션이 만료되었습니다.',
            status: refreshAxiosErr?.response?.status ?? 401,
          }),
        );
      }
      finally {
        isRefreshing = false;
      }
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
