import { Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import { maskUrl } from '@pkg/shared';
import { hmac } from '@pkg/shared/server';
import type { NextFunction, Request, Response } from 'express';

import { env } from '#/env';

function parseResponseBody(body: unknown): unknown {
  if (body === undefined || body === null || body === '') return '(empty)';
  if (typeof body !== 'string') return body;
  try {
    return JSON.parse(body);
  }
  catch {
    return body;
  }
}

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const startedAt = Date.now();
    let responseBody: unknown;

    const originalSend = response.send.bind(response);
    response.send = function (chunk: unknown): Response {
      responseBody = Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : chunk;
      return originalSend(chunk);
    };

    response.on('finish', () => {
      this.handleFinish(request, response, startedAt, responseBody);
    });

    next();
  }

  private handleFinish(request: Request, response: Response, startedAt: number, responseBody: unknown): void {
    const duration = Date.now() - startedAt;
    const { statusCode } = response;
    const url = maskUrl(request.originalUrl);

    const isError = statusCode >= 400;

    const requestId = request.requestId ?? '-';
    const user = request.session?.user;

    const reqBody = request.body as Record<string, unknown> | undefined;
    const hasReqBody = Boolean(reqBody) && Object.keys(reqBody ?? {}).length > 0;

    const meta = {
      requestId,
      method: request.method,
      url,
      statusCode,
      duration,
      ip: (request.headers['x-forwarded-for'] as string) || request.socket?.remoteAddress || null,
      userAgent: (request.headers['user-agent'] as string) || null,
      emailHash: user?.email ? hmac(user.email, env.APP_SECRET) : null,
      request: hasReqBody ? reqBody : null,
      response: parseResponseBody(responseBody),
    };

    const message = `${request.method} ${url} ${statusCode} (${duration}ms)`;

    if (isError) {
      this.logger.error(message, meta);
    }
    else {
      this.logger.log(message, meta);
    }
  }
}
