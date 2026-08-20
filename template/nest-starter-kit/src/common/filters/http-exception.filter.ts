import { ArgumentsHost, Catch, type ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { TFunction } from '@pkg/shared/server';
import type { Request, Response } from 'express';

import { ApiErrorResponseDto, ApiResponse } from '#/common/dto/api-response.dto';

type RequestWithI18n = Request & { t: TFunction };

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter<HttpException> {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<RequestWithI18n>();
    const response = http.getResponse<Response>();
    const statusCode = exception.getStatus();
    const errorCode = HttpStatus[statusCode] ?? 'HTTP_ERROR';
    const messageKey = `error.${errorCode}`;
    const message = request.t(messageKey);

    const body: ApiErrorResponseDto = {
      ...ApiResponse.error({ errorCode, message, statusCode }),
      statusCode,
      path: request.originalUrl,
      requestId: request.requestId ?? '-',
      timestamp: new Date().toISOString(),
    };

    response.status(statusCode).json(body);
  }
}
