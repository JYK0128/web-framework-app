import { ArgumentsHost, Catch, type ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import type { TFunction } from '@pkg/shared/server';
import type { Request, Response } from 'express';

import { ApiErrorResponseDto, ApiResponse } from '#/common/dto/api-response.dto';

type RequestWithI18n = Request & { t: TFunction };

@Catch()
export class UnexpectedExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(UnexpectedExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<RequestWithI18n>();
    const response = http.getResponse<Response>();
    const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    const errorCode = 'INTERNAL_SERVER_ERROR';
    const messageKey = `error.${errorCode}`;
    const message = request.t(messageKey);

    this.logger.error(exception);

    const body: ApiErrorResponseDto = {
      ...ApiResponse.error({
        errorCode,
        message,
        statusCode,
      }),
      statusCode,
      path: request.originalUrl,
      requestId: request.requestId ?? '-',
      timestamp: new Date().toISOString(),
    };

    response.status(statusCode).json(body);
  }
}
