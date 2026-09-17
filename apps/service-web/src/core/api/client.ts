import { ApplicationError } from '@pkg/shared/common';
import { getGlobalStartContext } from '@tanstack/react-start';
import Axios, { AxiosHeaders, type AxiosRequestConfig, isAxiosError } from 'axios';

type ApiErrorBody = {
  errorCode?: string
  message?: string
  statusCode?: number
  details?: unknown
};

type StartRequestContext = {
  request?: Request
};

const stateChangingMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const axiosInstance = Axios.create({ withCredentials: true });
let csrfTokenPromise: Promise<string> | undefined;

export function resetCsrfToken(): void {
  csrfTokenPromise = undefined;
}

function getStartRequest(): Request | undefined {
  const context = getGlobalStartContext() as StartRequestContext | undefined;
  return context?.request;
}

async function getCsrfToken(): Promise<string> {
  csrfTokenPromise ??= fetch('/csrf-token', { credentials: 'same-origin' })
    .then(async (response) => {
      if (!response.ok) throw new ApplicationError({ code: 'CSRF_TOKEN_REQUEST_FAILED', status: response.status });
      const body = await response.json() as { csrfToken: string };
      return body.csrfToken;
    })
    .catch((error: unknown) => {
      resetCsrfToken();
      throw error;
    });

  return csrfTokenPromise;
}

axiosInstance.interceptors.request.use(async (config) => {
  const request = getStartRequest();
  if (request) {
    const headers = AxiosHeaders.from(config.headers);
    const cookie = request.headers.get('cookie');
    if (cookie && !headers.has('cookie')) headers.set('cookie', cookie);
    config.headers = headers;
    if (!config.baseURL) config.baseURL = new URL(request.url).origin;
  }

  const method = config.method?.toUpperCase() ?? 'GET';
  if (typeof window !== 'undefined' && stateChangingMethods.has(method) && config.url?.startsWith('/api/')) {
    config.headers.set('x-csrf-token', await getCsrfToken());
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (!isAxiosError(error)) return Promise.reject(ApplicationError.from(error));

    const body = error.response?.data as ApiErrorBody | undefined;
    return Promise.reject(new ApplicationError({
      code: body?.errorCode ?? 'API_REQUEST_FAILED',
      message: body?.message ?? error.message,
      status: body?.statusCode ?? error.response?.status,
      details: body?.details,
    }));
  },
);

export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await axiosInstance.request<T>(config);
  return response.data;
}
