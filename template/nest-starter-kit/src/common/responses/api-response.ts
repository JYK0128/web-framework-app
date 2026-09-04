import { HttpException, HttpStatus } from '@nestjs/common';
import { ApplicationError, when } from '@pkg/shared/common';
import { getMetadataStorage, type ValidationError } from 'class-validator';
import type { Request, Response } from 'express';

import { ApiBaseResponseDto, ApiErrorResponseDto, ApiSuccessResponseDto } from '#/common/dto/api-response.dto';

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

  private static formatSingleValidationError(
    err: ValidationError,
    translate?: Translate,
  ): string | undefined {
    if (!err.constraints) return undefined;
    const entries = Object.entries(err.constraints);
    if (entries.length === 0) return undefined;

    const [key, defaultMessage] = entries[0];
    const storage = getMetadataStorage();
    let constraints: unknown[] | undefined;

    if (err.target?.constructor) {
      const metas = storage.getTargetValidationMetadatas(err.target.constructor, '', false, false);
      const meta = metas.find((m) => m.propertyName === err.property && m.name === key);
      if (meta?.constraints) {
        constraints = meta.constraints;
      }
    }

    const translationKey = `validation.${key}`;
    const translated = translate?.(translationKey, when((value): value is unknown[] => Array.isArray(value), (constraints) => ({ constraints }))(constraints));
    return (typeof translated === 'string' && translated !== translationKey)
      ? translated
      : defaultMessage;
  }

  private static translateValidationErrors(
    errors: unknown,
    translate?: Translate,
    parentPath = '',
  ): { fields: Record<string, string> } | undefined {
    if (!Array.isArray(errors) || errors.length === 0) {
      return undefined;
    }

    const fields: Record<string, string> = {};

    for (const err of errors as ValidationError[]) {
      if (!err || typeof err !== 'object' || !('property' in err)) continue;
      const fieldPath = parentPath ? `${parentPath}.${err.property}` : err.property;

      const message = this.formatSingleValidationError(err, translate);
      if (message) {
        fields[fieldPath] = message;
      }

      if (err.children?.length) {
        const childRes = this.translateValidationErrors(err.children, translate, fieldPath);
        if (childRes?.fields) {
          Object.assign(fields, childRes.fields);
        }
      }
    }

    return { fields };
  }

  private static mapException(exception: unknown, translate?: Translate): ApiErrorResponseDto {
    if (exception instanceof ApplicationError) {
      const errorCode = exception.code;
      const details = this.translateValidationErrors(exception.details, translate)
        ?? (exception.details as Record<string, unknown> | undefined);

      return this.fail({
        statusCode: exception.status ?? HttpStatus.BAD_REQUEST,
        errorCode,
        message: translate?.(`error.${errorCode}`, exception.params) ?? `error.${errorCode}`,
        details,
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
