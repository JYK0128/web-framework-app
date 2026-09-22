import { Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import { LogEntry, LogLevel } from '#/entities/logs/log-entry.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  constructor(private readonly em: AppEntityManager) {}

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

      let level: LogLevel = LogLevel.INFO;
      if (statusCode >= 500) level = LogLevel.ERROR;
      else if (statusCode >= 400) level = LogLevel.WARN;
      const logEm = this.em.fork();
      const entry = logEm.create(LogEntry, {
        level,
        method: request.method,
        path: request.originalUrl,
        statusCode,
        durationMs: duration,
        requestId,
        ipAddress: request.ip ?? null,
        userAgent: request.get('user-agent') ?? null,
      });
      logEm.persist(entry);
      void logEm.flush().catch((error: unknown) => this.logger.warn(`Failed to persist HTTP log: ${String(error)}`));
    };

    response.once('finish', onFinish);
    next();
  }
}
