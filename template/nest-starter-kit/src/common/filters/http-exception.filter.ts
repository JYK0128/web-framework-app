import { ArgumentsHost, Catch, type ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import type { TFunction } from '@pkg/shared/server';
import type { Request, Response } from 'express';
import { ClsService } from 'nestjs-cls';

import { type ApiErrorResponse, ApiResponse } from '#/common/dto/api-response.dto';

type RequestWithI18n = Request & { t?: TFunction };

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly cls: ClsService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<RequestWithI18n>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message = 'Internal Server Error';
    let details: unknown = undefined;

    if (exception instanceof ApplicationError) {
      status = exception.status || HttpStatus.BAD_REQUEST;
      errorCode = exception.code;
      message = request.t
        ? request.t(`error.${errorCode}`, {
          defaultValue: resolveMessage(exception.message),
          ...exception.params,
        })
        : resolveMessage(exception.message);
      details = exception.details;
    }
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      errorCode = exception.name;
      message = resolveMessage(exception.getResponse());
    }
    else if (exception instanceof Error) {
      errorCode = exception.name;
      message = exception.message;
    }

    const body: ApiErrorResponse = ApiResponse.error(
      errorCode,
      message,
      status,
      request.originalUrl,
      this.cls.get('requestId'),
      details,
    );

    response.status(status).json(body);
  }
}

function resolveMessage(message: unknown): string {
  if (typeof message === 'string') {
    return message;
  }

  if (Array.isArray(message)) {
    return message.filter((m) => typeof m === 'string').at(0) || 'Unknown Error';
  }

  if (typeof message === 'object' && message !== null) {
    const payload = message as Record<string, unknown>;
    return resolveMessage(payload.message);
  }

  return 'Request failed';
}
