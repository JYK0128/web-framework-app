import type { ApiErrorResponseDto, ApiResponseDto, ApiSuccessResponseDto, ErrorCode as ResponseErrorCode, SuccessCode as ResponseSuccessCode } from '@pkg/server-core/http/dto/response';

import ko from '~/locales/ko.json';

export type SuccessCode = ResponseSuccessCode<keyof typeof ko.success>;
export type ErrorCode = ResponseErrorCode<keyof typeof ko.error>;

export type ApiSuccessResponse<T> = ApiSuccessResponseDto<T, SuccessCode>;
export type ApiErrorResponse = ApiErrorResponseDto<ErrorCode>;
export type ApiResponse<T> = ApiResponseDto<T, SuccessCode, ErrorCode>;
