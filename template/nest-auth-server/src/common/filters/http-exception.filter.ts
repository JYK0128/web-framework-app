import { ArgumentsHost, Catch, type ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

import { requestContext } from '#/common/context/request-context';
import type { ApiErrorResponse } from '#/common/types/api-response.type';

type ExceptionResponse = {
  code?: unknown
  details?: unknown
  message?: unknown
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = isHttpException ? exception.getResponse() : undefined;
    const payload = isRecord(exceptionResponse) ? exceptionResponse : {};
    const body: ApiErrorResponse = {
      statusCode: status,
      code: typeof payload.code === 'string' ? payload.code : `HTTP_${status}`,
      message: resolveMessage(exceptionResponse, payload, isHttpException),
      path: request.originalUrl,
      requestId: requestContext.getRequestId() ?? '-',
      timestamp: new Date().toISOString(),
    };

    if ('details' in payload) {
      body.details = payload.details;
    }

    response.status(status).json(body);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function resolveMessage(
  exceptionResponse: string | object | undefined,
  payload: ExceptionResponse,
  isHttpException: boolean,
): string {
  if (typeof payload.message === 'string') return payload.message;
  if (Array.isArray(payload.message)) return payload.message.filter((message): message is string => typeof message === 'string').join(', ');
  if (typeof exceptionResponse === 'string') return exceptionResponse;
  if (isHttpException) return 'Request failed';
  return 'Internal server error';
}
