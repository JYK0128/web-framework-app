import { ArgumentsHost, Catch, type ExceptionFilter } from '@nestjs/common';
import type { Request, Response } from 'express';

import { ApiResponse } from '#/common/responses';

@Catch()
export class UnexpectedExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    request.rawError = exception;
    const body = ApiResponse.fromException(exception, request, response);
    response.status(body.statusCode).json(body);
  }
}
