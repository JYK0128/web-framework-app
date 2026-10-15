import { ArgumentsHost, Catch, type ExceptionFilter } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import type { Request, Response } from 'express';

import { ApiResponse } from '#http/api.response';

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
