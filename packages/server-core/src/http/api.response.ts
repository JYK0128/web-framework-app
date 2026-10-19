import { HttpException, HttpStatus } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import { getMetadataStorage, type ValidationError } from 'class-validator';
import type { Request, Response } from 'express';

import { ApiBaseResponseDto, ApiErrorResponseDto, type ApiResponseDto, ApiSuccessResponseDto, type ErrorCode } from '#http/dto/response/api.response.dto';

export class ApiResponse {
  static from<T, TSuccessCode extends string = string, TErrorCode extends string = string>(
    value: T,
    req: Request,
    res?: Response,
  ): ApiResponseDto<T, TSuccessCode, TErrorCode> {
    const result: ApiBaseResponseDto<unknown> = value instanceof ApiBaseResponseDto
      ? value
      : ApiSuccessResponseDto.parse<ApiSuccessResponseDto<T, TSuccessCode>>({
        data: value,
        message: 'success.COMPLETED',
      });

    if (result.message) result.message = this.translate(req, result.message);
    return this.applyMetadata(result as ApiResponseDto<T, TSuccessCode, TErrorCode>, req, res);
  }

  static fromError<TErrorCode extends string = string>(exception: unknown, req: Request): ApiErrorResponseDto<TErrorCode> {
    let error: ApplicationError;
    if (exception instanceof ApplicationError) {
      error = exception;
    }
    else if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      const code = typeof response === 'object' && 'code' in response
        ? String(response.code)
        : HttpStatus[status] ?? 'HTTP_ERROR';
      error = new ApplicationError({ code, status });
    }
    else {
      error = ApplicationError.from(exception, { code: 'INTERNAL_SERVER_ERROR', status: HttpStatus.INTERNAL_SERVER_ERROR });
    }

    return ApiErrorResponseDto.parse<ApiErrorResponseDto<TErrorCode>>({
      ...error.toJSON<ErrorCode<TErrorCode>>({
        path: req.originalUrl,
        requestId: req.header('x-request-id') ?? (req as unknown as { requestId?: string }).requestId ?? '-',
        i18n: { t: req.t },
      }),
      details: translateValidationErrors(req, error.details)
        ?? error.details as Record<string, unknown> | undefined,
    });
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

  private static translate(req: Request, key: string, params?: Record<string, unknown>): string {
    const translated = req.t(key, params);
    return translated === key ? key : translated;
  }
}

function translateValidationErrors(req: Request, errors: unknown): { fields: Record<string, string> } | undefined {
  if (!Array.isArray(errors) || errors.length === 0) return undefined;

  const fields: Record<string, string> = {};
  const storage = getMetadataStorage();
  collectValidationErrors(req, errors as ValidationError[], fields, storage);
  return { fields };
}

function collectValidationErrors(
  req: Request,
  errors: ValidationError[],
  fields: Record<string, string>,
  storage: ReturnType<typeof getMetadataStorage>,
  parentPath = '',
): void {
  for (const error of errors) {
    const fieldPath = parentPath ? `${parentPath}.${error.property}` : error.property;
    const translated = translateValidationError(req, error, storage);
    if (translated) fields[fieldPath] = translated;
    if (error.children?.length) collectValidationErrors(req, error.children, fields, storage, fieldPath);
  }
}

function translateValidationError(
  req: Request,
  error: ValidationError,
  storage: ReturnType<typeof getMetadataStorage>,
): string | undefined {
  const [constraint, fallback] = Object.entries(error.constraints ?? {})[0] ?? [];
  if (!constraint) return undefined;

  const constraints = error.target?.constructor
    ? storage.getTargetValidationMetadatas(error.target.constructor, '', false, false)
      .find((item) => item.propertyName === error.property && item.name === constraint)?.constraints
    : undefined;
  const key = `validation.${constraint}`;
  const translated = req.t(key, Array.isArray(constraints) ? { constraints } : undefined);
  return translated === key ? fallback : translated;
}
