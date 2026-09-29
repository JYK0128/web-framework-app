import { HttpException, HttpStatus } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import type { Request, Response } from 'express';

import { ApiBaseResponseDto, ApiErrorResponseDto, ApiSuccessResponseDto } from '#/common/dto/api-response.dto';

export class ApiResponse {
  static from<T>(value: T, req: Request, res?: Response): ApiBaseResponseDto<T> {
    const result = value instanceof ApiBaseResponseDto
      ? value
      : this.success(value);

    return this.applyMetadata(result, req, res);
  }

  static fromException(exception: unknown, req: Request, res?: Response): ApiErrorResponseDto {
    const errorDto = this.mapException(exception);
    return this.applyMetadata(errorDto, req, res);
  }

  static ok(): ApiSuccessResponseDto<{ success: true }> {
    return this.success({ success: true });
  }

  static success<T>(data: T): ApiSuccessResponseDto<T> {
    return ApiSuccessResponseDto.fromPlain<ApiSuccessResponseDto<T>>({ data });
  }

  static fail(input?: Partial<ApiErrorResponseDto>): ApiErrorResponseDto {
    return ApiErrorResponseDto.fromPlain(input);
  }

  private static applyMetadata<T extends ApiBaseResponseDto<unknown>>(
    dto: T,
    req: Request,
    res?: Response,
  ): T {
    if (res?.statusCode) {
      dto.statusCode ??= res.statusCode;
    }
    dto.path = req.originalUrl;
    dto.requestId = (req.header('x-request-id')) ?? (req as unknown as { requestId?: string }).requestId ?? '-';
    dto.timestamp = new Date().toISOString();

    return dto;
  }

  private static mapException(exception: unknown): ApiErrorResponseDto {
    if (exception instanceof ApplicationError) {
      const errorCode = exception.code;
      return this.fail({
        statusCode: exception.status ?? HttpStatus.BAD_REQUEST,
        errorCode,
        message: exception.message || `error.${errorCode}`,
        details: exception.details as Record<string, unknown> | undefined,
      });
    }

    if (this.isHttpException(exception)) {
      const statusCode = exception.getStatus();
      const response = exception.getResponse();
      const isResponseObject = typeof response === 'object' && Boolean(response);
      const errorCode = isResponseObject && 'code' in response
        ? String((response).code)
        : HttpStatus[statusCode] ?? 'HTTP_ERROR';
      const message = isResponseObject && 'message' in response
        ? (response as { message: string | string[] }).message
        : exception.message;

      return this.fail({
        statusCode,
        errorCode,
        message: Array.isArray(message) ? message.join(', ') : message,
      });
    }

    const errorCode = 'INTERNAL_SERVER_ERROR';
    return this.fail({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode,
      message: 'Internal Server Error',
    });
  }

  private static isHttpException(exception: unknown): exception is HttpException {
    return typeof exception === 'object'
      && exception !== null
      && typeof (exception as { getStatus?: unknown }).getStatus === 'function'
      && typeof (exception as { getResponse?: unknown }).getResponse === 'function';
  }
}
