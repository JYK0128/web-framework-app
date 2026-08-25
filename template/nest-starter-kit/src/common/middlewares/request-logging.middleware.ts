import { Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import { maskUrl } from '@pkg/shared';
import { hmac } from '@pkg/shared/server';
import type { NextFunction, Request, Response } from 'express';

import { env } from '#/env';
import { ActivityErrorInfoDto } from '#/modules/activity-logs/dto/activity-error-info.dto';

function isEventStreamResponse(response: Response): boolean {
  const contentType = response.getHeader('content-type');
  const values = Array.isArray(contentType) ? contentType : [contentType];
  return values.some((value) => String(value ?? '').toLowerCase().includes('text/event-stream'));
}

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const startedAt = Date.now();

    const originalJson = response.json.bind(response);
    response.json = function (body: unknown): Response {
      response.body = body;
      return originalJson(body);
    };

    const originalSend = response.send.bind(response);
    response.send = function (chunk: unknown): Response {
      if (response.body === undefined) {
        response.body = Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : chunk;
      }
      return originalSend(chunk);
    };

    const originalEnd = response.end.bind(response);
    response.end = function (...args: unknown[]): Response {
      const [chunk] = args;
      if (response.body === undefined && chunk !== undefined && typeof chunk !== 'function') {
        response.body = Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : chunk;
      }
      return Reflect.apply(originalEnd, response, args) as Response;
    } as Response['end'];

    const cleanup = () => {
      response.removeListener('finish', onFinish);
      response.removeListener('close', onClose);
      response.removeListener('error', onError);
    };

    const onFinish = () => {
      cleanup();
      if (isEventStreamResponse(response)) return;
      this.handleComplete(request, response, startedAt, false);
    };

    const onClose = () => {
      cleanup();
      const aborted = !response.writableEnded;
      this.handleComplete(request, response, startedAt, aborted);
    };

    const onError = () => {
      cleanup();
      this.handleComplete(request, response, startedAt, true);
    };

    response.once('finish', onFinish);
    response.once('close', onClose);
    response.once('error', onError);

    next();
  }

  private handleComplete(request: Request, response: Response, startedAt: number, aborted: boolean): void {
    const duration = Date.now() - startedAt;
    const { statusCode, body: responseBody } = response;
    const url = maskUrl(request.originalUrl);

    const isError = aborted || statusCode >= 400;

    const requestId = request.requestId ?? '-';
    const user = request.session?.user;

    const reqBody = request.body as Record<string, unknown> | undefined;
    const hasReqBody = Boolean(reqBody) && Object.keys(reqBody ?? {}).length > 0;

    const errorInfo = isError
      ? ActivityErrorInfoDto.from(request.rawError, responseBody)
      : null;

    const meta = {
      requestId,
      method: request.method,
      url,
      statusCode,
      duration,
      aborted,
      ip: (request.headers['x-forwarded-for'] as string) || request.socket?.remoteAddress || null,
      userAgent: (request.headers['user-agent'] as string) || null,
      emailHash: user?.email ? hmac(user.email, env.APP_SECRET) : null,
      request: hasReqBody ? reqBody : null,
      response: responseBody ?? null,
      errorInfo,
    };

    const message = `${request.method} ${url} ${statusCode} (${duration}ms)${aborted ? ' [aborted]' : ''}`;

    if (isError) {
      this.logger.error(message, meta);
    }
    else {
      this.logger.log(message, meta);
    }
  }
}
