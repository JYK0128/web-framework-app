import { HttpException, HttpStatus } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import type { Request, Response } from 'express';

import { ApiBaseResponseDto, ApiErrorResponseDto, ApiSuccessResponseDto, type ApiValidationErrorDetailDto } from '#/common/dto/api-response.dto';

type Translate = (key: string, params?: Record<string, unknown>) => string;

export class ApiResponse {
  static from<T>(value: T, req: Request, res?: Response): ApiBaseResponseDto<T> {
    const result = value instanceof ApiBaseResponseDto
      ? value
      : this.success(value);

    return this.applyMetadata(result, req, res);
  }

  static fromException(exception: unknown, req: Request, res?: Response): ApiErrorResponseDto {
    const errorDto = this.mapException(exception, req.t);
    return this.applyMetadata(errorDto, req, res);
  }

  static success<T>(data: T): ApiSuccessResponseDto<T> {
    return new ApiSuccessResponseDto<T>({ data });
  }

  static fail(input?: Partial<ApiErrorResponseDto>): ApiErrorResponseDto {
    return new ApiErrorResponseDto(input);
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
    dto.requestId = req.requestId ?? '-';
    dto.timestamp = new Date().toISOString();

    return dto;
  }

  private static mapException(exception: unknown, translate?: Translate): ApiErrorResponseDto {
    if (exception instanceof ApplicationError) {
      const errorCode = exception.code;
      return this.fail({
        statusCode: exception.status ?? HttpStatus.BAD_REQUEST,
        errorCode,
        message: translate?.(`error.${errorCode}`, exception.params) ?? `error.${errorCode}`,
        details: exception.details as ApiValidationErrorDetailDto[] | undefined,
      });
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const errorCode = HttpStatus[statusCode] ?? 'HTTP_ERROR';

      return this.fail({
        statusCode,
        errorCode,
        message: translate?.(`error.${errorCode}`) ?? `error.${errorCode}`,
      });
    }

    const errorCode = 'INTERNAL_SERVER_ERROR';
    return this.fail({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode,
      message: translate?.(`error.${errorCode}`) ?? 'Internal Server Error',
    });
  }
}
