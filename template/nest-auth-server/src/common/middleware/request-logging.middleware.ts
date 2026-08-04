import { Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import { requestContext } from '#/common/context/request-context';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const startedAt = Date.now();

    response.on('finish', () => {
      const duration = Date.now() - startedAt;
      const requestId = requestContext.getRequestId() ?? '-';
      this.logger.log(`[${requestId}] ${request.method} ${request.originalUrl} ${response.statusCode} ${duration}ms`);
    });

    next();
  }
}
