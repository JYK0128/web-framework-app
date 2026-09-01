import { ApplicationError } from '@pkg/shared/common';
import { getGlobalStartContext } from '@tanstack/react-start';
import Axios, { AxiosHeaders, type AxiosHeaderValue, type AxiosRequestConfig, isAxiosError } from 'axios';

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

  if (!config.baseURL && request) config.baseURL = new URL(request.url).origin;
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

    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/onboarding')) {
      if (body.errorCode === 'EMAIL_VERIFICATION_REQUIRED') {
        window.location.href = '/onboarding/email';
      }
      else if (body.errorCode === 'TERMS_AGREEMENT_REQUIRED') {
        window.location.href = '/onboarding/term';
      }
      else if (body.errorCode === 'PHONE_VERIFICATION_REQUIRED') {
        window.location.href = '/onboarding/phone';
      }
    }

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
