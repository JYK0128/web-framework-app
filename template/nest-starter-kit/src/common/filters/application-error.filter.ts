import { ArgumentsHost, Catch, type ExceptionFilter } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import type { Request, Response } from 'express';

import { ApiResponse } from '#/common/responses';

@Catch(ApplicationError)
export class ApplicationErrorFilter implements ExceptionFilter<ApplicationError> {
  catch(exception: ApplicationError, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    request.rawError = exception;
    const body = ApiResponse.fromException(exception, request, response);
    response.status(body.statusCode).json(body);
  }
}
