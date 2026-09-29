import { Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const startedAt = Date.now();

    const onFinish = () => {
      const duration = Date.now() - startedAt;
      const { statusCode } = response;
      const requestId = (request as unknown as { requestId?: string }).requestId ?? request.header('x-request-id') ?? '-';
      const message = `${request.method} ${request.originalUrl} ${statusCode} (${duration}ms) [requestId=${requestId}]`;

      if (statusCode >= 400) {
        this.logger.error(message);
      }
      else {
        this.logger.log(message);
      }
    };

    response.once('finish', onFinish);
    next();
  }
}
