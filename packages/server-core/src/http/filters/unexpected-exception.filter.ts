import { ArgumentsHost, Catch, type ExceptionFilter } from '@nestjs/common';
import type { Request, Response } from 'express';

import { ApiResponse } from '#http/api.response';

@Catch()
export class UnexpectedExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const body = ApiResponse.fromError(exception, request);
    response.status(body.statusCode).json(body);
  }
}
