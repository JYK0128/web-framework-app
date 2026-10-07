import { HttpException, HttpStatus } from '@nestjs/common';
import { ApplicationError, when } from '@pkg/shared/common';
import { getMetadataStorage, type ValidationError } from 'class-validator';
import type { Request } from 'express';

type Translate = (key: string, params?: Record<string, unknown>) => string;

export function createErrorResponse(exception: unknown, req: Request) {
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

  return {
    ...error.toJSON({
      path: req.originalUrl,
      requestId: req.requestId ?? '-',
      i18n: { t: req.t },
    }),
    details: translateValidationErrors(error.details, req.t)
      ?? error.details as Record<string, unknown> | undefined,
  };
}

function formatSingleValidationError(
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

function translateValidationErrors(
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

    const message = formatSingleValidationError(err, translate);
    if (message) {
      fields[fieldPath] = message;
    }

    if (err.children?.length) {
      const childRes = translateValidationErrors(err.children, translate, fieldPath);
      if (childRes?.fields) {
        Object.assign(fields, childRes.fields);
      }
    }
  }

  return { fields };
}
