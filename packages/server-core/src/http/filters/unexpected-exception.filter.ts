import { ArgumentsHost, Catch, type ExceptionFilter } from '@nestjs/common';
import { ApiResponse } from '@pkg/server-core/http/api.response';
import type { Request, Response } from 'express';

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
