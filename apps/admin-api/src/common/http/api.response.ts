import { HttpException, HttpStatus } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import { getMetadataStorage, type ValidationError } from 'class-validator';
import type { Request, Response } from 'express';

import { ApiBaseResponseDto, ApiErrorResponseDto, ApiSuccessResponseDto, type ErrorCode, type SuccessCode } from '#/common/interfaces/response/api.response.dto';

export class ApiResponse {
  static from<T>(value: T, req: Request, res?: Response): ApiBaseResponseDto<T> {
    const result = value instanceof ApiBaseResponseDto
      ? value
      : this.success(value);

    if (result.message) result.message = this.translate(req, result.message);
    return this.applyMetadata(result, req, res);
  }

  static fromException(exception: unknown, req: Request, res?: Response): ApiErrorResponseDto {
    const errorDto = this.mapException(exception, req);
    return this.applyMetadata(errorDto, req, res);
  }

  static ok(): ApiSuccessResponseDto<{ success: true }> {
    return this.success({ success: true });
  }

  static success<T>(data: T, successCode: SuccessCode = 'COMPLETED'): ApiSuccessResponseDto<T> {
    return ApiSuccessResponseDto.fromPlain<ApiSuccessResponseDto<T>>({
      data,
      message: `success.${successCode}`,
    });
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

  private static translate(req: Request, key: string, params?: Record<string, unknown>): string {
    const translated = req.t(key, params);
    return translated === key ? key : translated;
  }

  private static translateValidationErrors(req: Request, errors: unknown): { fields: Record<string, string> } | undefined {
    if (!Array.isArray(errors) || errors.length === 0) return undefined;

    const fields: Record<string, string> = {};
    const storage = getMetadataStorage();
    this.collectValidationErrors(req, errors as ValidationError[], fields, storage);
    return { fields };
  }

  private static collectValidationErrors(
    req: Request,
    errors: ValidationError[],
    fields: Record<string, string>,
    storage: ReturnType<typeof getMetadataStorage>,
    parentPath = '',
  ): void {
    for (const error of errors) {
      const fieldPath = parentPath ? `${parentPath}.${error.property}` : error.property;
      const translated = this.translateValidationError(req, error, storage);
      if (translated) fields[fieldPath] = translated;
      if (error.children?.length) this.collectValidationErrors(req, error.children, fields, storage, fieldPath);
    }
  }

  private static translateValidationError(
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
    const translated = this.translate(req, key, Array.isArray(constraints) ? { constraints } : undefined);
    return translated === key ? fallback : translated;
  }

  private static mapException(exception: unknown, req: Request): ApiErrorResponseDto {
    if (exception instanceof ApplicationError) {
      const errorCode = this.toErrorCode(exception.code);
      return this.fail({
        statusCode: exception.status ?? HttpStatus.BAD_REQUEST,
        errorCode,
        message: this.translate(req, `error.${errorCode}`, exception.params),
        details: this.translateValidationErrors(req, exception.details)
          ?? exception.details as Record<string, unknown> | undefined,
      });
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const response = exception.getResponse();
      const isResponseObject = typeof response === 'object' && Boolean(response);
      const errorCode = this.toErrorCode(isResponseObject && 'code' in response
        ? String(response.code)
        : HttpStatus[statusCode] ?? 'HTTP_ERROR');

      return this.fail({
        statusCode,
        errorCode,
        message: this.translate(req, `error.${errorCode}`),
      });
    }

    const errorCode = this.toErrorCode('INTERNAL_SERVER_ERROR');
    return this.fail({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode,
      message: this.translate(req, 'error.INTERNAL_SERVER_ERROR'),
    });
  }

  private static toErrorCode(code: string): ErrorCode {
    return code as ErrorCode;
  }
}
