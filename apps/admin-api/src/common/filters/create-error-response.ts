import { HttpException, HttpStatus } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import { getMetadataStorage, type ValidationError } from 'class-validator';
import type { Request } from 'express';

import type { ErrorCode } from '#/common/interfaces/response/api.response.dto';

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
    ...error.toJSON<ErrorCode>({
      path: req.originalUrl,
      requestId: req.header('x-request-id') ?? (req as unknown as { requestId?: string }).requestId ?? '-',
      i18n: { t: req.t },
    }),
    details: translateValidationErrors(req, error.details)
      ?? error.details as Record<string, unknown> | undefined,
  };
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
