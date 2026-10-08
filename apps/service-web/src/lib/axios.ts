import { ApplicationError } from '@pkg/shared/common';
import { createIsomorphicFn } from '@tanstack/react-start';
import { getRequest, getResponseHeaders } from '@tanstack/react-start/server';
import Axios, { AxiosHeaders, type AxiosHeaderValue, type AxiosRequestConfig, isAxiosError } from 'axios';
import { toast } from 'sonner';

import type { ApiErrorResponseDto } from '#/.generated/api/model/apiErrorResponseDto';
import { SILENT_QUERY_PATHS } from '#/configs/app.config';
import { getI18n } from '#/core/isomorphic/i18n';

type ApiResult<T> = T extends { data?: infer D } ? D : T;
type AxiosFunction = <T>(config: AxiosRequestConfig, options?: AxiosRequestConfig) => Promise<ApiResult<T>>;

function handleResponseError(error: unknown): never {
  if (error instanceof Error && Axios.isCancel(error)) throw error;
  if (!isAxiosError(error)) {
    if (error instanceof Error) throw error;
    throw new Error(String(error));
  }
  const body = error.response?.data as ApiErrorResponseDto | undefined;
  throw new ApplicationError({
    code: body?.errorCode ?? 'API_REQUEST_FAILED',
    status: body?.statusCode ?? error.response?.status,
    details: body?.details,
    params: body?.meta?.params as Record<string, unknown> | undefined,
  });
}

const browserClient = Axios.create({ withCredentials: true });
browserClient.interceptors.request.use((config) => {
  if (!config.headers.has('accept-language')) {
    const i18n = getI18n();
    config.headers.set('accept-language', i18n.resolvedLanguage ?? i18n.language);
  }
  return config;
});
browserClient.interceptors.response.use((response) => response, (error: unknown) => {
  if (isAxiosError(error) && error.response?.status === 401) {
    const path = new URL(error.config?.url ?? '', window.location.origin).pathname;
    if (!['/api/v1/auth/login', '/api/v1/auth/login/2fa'].includes(path)) {
      window.dispatchEvent(new Event('auth-session-expired'));
    }
  }
  return handleResponseError(error);
});

const isomorphicAxios = createIsomorphicFn()
  .server(async <T>(config: AxiosRequestConfig, options?: AxiosRequestConfig): Promise<ApiResult<T>> => {
    const request = getRequest();
    const origin = process.env.APP_BASE_URL;
    if (!origin) throw new Error('APP_BASE_URL is required');
    const i18n = getI18n();
    const client = Axios.create({
      baseURL: origin,
      headers: {
        'cookie': request.headers.get('cookie') ?? undefined,
        'origin': new URL(origin).origin,
        'accept-language': i18n.resolvedLanguage ?? i18n.language,
      },
    });
    function forwardCookies(cookies: unknown) {
      if (Array.isArray(cookies)) {
        const headers = getResponseHeaders();
        for (const cookie of cookies) {
          if (typeof cookie === 'string') headers.append('Set-Cookie', cookie);
        }
      }
    }
    client.interceptors.response.use(
      (response) => {
        forwardCookies(response.headers['set-cookie']);
        return response;
      },
      (error: unknown) => {
        if (isAxiosError(error)) forwardCookies(error.response?.headers['set-cookie']);
        return handleResponseError(error);
      },
    );
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
      if (showToast && !path.startsWith('/api/v1/auth/') && (requestConfig.method ?? 'get').toLowerCase() !== 'get'
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

export function axios<T>(config: AxiosRequestConfig, options?: AxiosRequestConfig): Promise<ApiResult<T>> {
  return isomorphicAxios<T>(config, options);
}

export default axios;
