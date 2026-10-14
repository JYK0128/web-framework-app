import { ArgumentsHost, Catch, type ExceptionFilter } from '@nestjs/common';
import { ApiResponse } from '@pkg/server-core/http/api.response';
import { ApplicationError } from '@pkg/shared/common';
import type { Request, Response } from 'express';

@Catch(ApplicationError)
export class ApplicationErrorFilter implements ExceptionFilter<ApplicationError> {
  catch(exception: ApplicationError, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const body = ApiResponse.fromError(exception, request);
    response.status(body.statusCode).json(body);
  }
}
