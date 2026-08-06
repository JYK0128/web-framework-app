import { ApplicationError } from '@pkg/shared/common';
import Axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
import type { ApiErrorResponseDto } from '#/.generated/api/model';

const getBaseUrl = (): string => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) {
    return (import.meta as any).env.VITE_API_BASE_URL;
  }
  if (typeof globalThis !== 'undefined' && 'process' in globalThis) {
    const proc = (globalThis as any).process;
    return proc?.env?.VITE_API_BASE_URL || proc?.env?.API_BASE_URL || 'http://localhost:4000';
  }
  return 'http://localhost:4000';
};

export const AXIOS_INSTANCE = Axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
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
  } catch (error) {
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
