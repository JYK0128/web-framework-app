import { ApplicationError } from '@pkg/shared/common';
import { createIsomorphicFn, getGlobalStartContext } from '@tanstack/react-start';
import Axios, { AxiosHeaders, type AxiosHeaderValue, type AxiosRequestConfig, isAxiosError } from 'axios';

import { getEnv } from '#/env';

type ApiEnvelope = {
  errorCode?: string
  message?: string
  statusCode?: number
  details?: unknown
};

type ApiResult<T> = T extends { data?: infer D } ? D : T;

type StartRequestContext = {
  request?: Request
};

const AXIOS_INSTANCE = Axios.create({
  withCredentials: true,
});

const getFrontendUrl = createIsomorphicFn()
  .server(() => getEnv().FRONTEND_URL)
  .client(() => undefined);

function normalizeHeaders(headers: AxiosRequestConfig['headers']): AxiosHeaders {
  return AxiosHeaders.from(headers as unknown as Record<string, AxiosHeaderValue> | undefined);
}

function getStartRequest(): Request | undefined {
  const context = getGlobalStartContext() as StartRequestContext | undefined;
  return context?.request;
}

AXIOS_INSTANCE.interceptors.request.use((config) => {
  const request = getStartRequest();
  if (request) {
    const headers = AxiosHeaders.from(config.headers);
    const cookie = request.headers.get('cookie');
    if (cookie && !headers.has('cookie')) headers.set('cookie', cookie);
    config.headers = headers;
  }

  if (!config.baseURL) config.baseURL = getFrontendUrl();
  return config;
});

AXIOS_INSTANCE.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (!isAxiosError(error)) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }

    const body = error.response?.data as ApiEnvelope | undefined;
    if (!error.response || !body?.errorCode) return Promise.reject(error);

    return Promise.reject(new ApplicationError({
      code: body.errorCode,
      message: body.message,
      status: body.statusCode,
      details: body.details,
    }));
  },
);

export const axios = async <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<ApiResult<T>> => {
  const headers = AxiosHeaders.concat(normalizeHeaders(config.headers), normalizeHeaders(options?.headers));

  const response = await AXIOS_INSTANCE<T>({
    ...config,
    ...options,
    headers,
  });

  return (response.data as { data: ApiResult<T> }).data;
};

export default axios;
