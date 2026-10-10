import { Injectable, type NestMiddleware } from '@nestjs/common';
import { maskUrl } from '@pkg/shared';
import { hmac } from '@pkg/shared/server';
import type { NextFunction, Request, Response } from 'express';

import { env } from '#/env';
import { LoggerService } from '#/infra/logger/logger.service';
import { LogErrorInfoDto } from '#/modules/logs/dto';

function isEventStreamResponse(response: Response): boolean {
  const contentType = response.getHeader('content-type');
  const values = Array.isArray(contentType) ? contentType : [contentType];
  return values.some((value) => String(value ?? '').toLowerCase().includes('text/event-stream'));
}

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const startedAt = Date.now();
    const responseContext = response as Response & { body?: unknown };

    const originalJson = response.json.bind(response);
    response.json = function (body: unknown): Response {
      responseContext.body = body;
      return originalJson(body);
    };

    const originalSend = response.send.bind(response);
    response.send = function (chunk: unknown): Response {
      if (responseContext.body === undefined) {
        responseContext.body = Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : chunk;
      }
      return originalSend(chunk);
    };

    const originalEnd = response.end.bind(response);
    response.end = function (...args: unknown[]): Response {
      const [chunk] = args;
      if (responseContext.body === undefined && chunk !== undefined && typeof chunk !== 'function') {
        responseContext.body = Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : chunk;
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
      if (!isEventStreamResponse(response)) this.handleComplete(request, response, startedAt, false);
    };
    const onClose = () => {
      cleanup();
      if (isEventStreamResponse(response)) return;
      if (!response.writableEnded) this.handleComplete(request, response, startedAt, true);
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
    const { statusCode, body: responseBody } = response as Response & { body?: unknown };
    const url = maskUrl(request.originalUrl);
    const isError = aborted || statusCode >= 400;
    const requestContext = request as Request & { requestId?: string, rawError?: unknown };
    const user = (request.session as (typeof request.session & { user?: { email?: string } }) | undefined)?.user;
    const requestBody = request.body as Record<string, unknown> | undefined;
    const hasRequestBody = Boolean(requestBody) && Object.keys(requestBody ?? {}).length > 0;
    const errorInfo = isError ? LogErrorInfoDto.from(requestContext.rawError, responseBody) : null;
    let level = 'info';
    if (statusCode >= 400 && statusCode < 500) level = 'warn';
    if (statusCode >= 500 || aborted) level = 'error';

    const meta = {
      id: requestContext.requestId,
      createdAt: new Date().toISOString(),
      level,
      requestId: requestContext.requestId ?? '-',
      method: request.method,
      url,
      statusCode,
      duration,
      aborted,
      ip: (request.headers['x-forwarded-for'] as string) || request.socket.remoteAddress || null,
      userAgent: (request.headers['user-agent'] as string) || null,
      emailHash: user?.email ? hmac(user.email, env.PII_HASH_KEY) : null,
      request: hasRequestBody ? requestBody : null,
      response: responseBody ?? null,
      errorInfo,
    };
    const message = `${request.method} ${url} ${statusCode} (${duration}ms)${aborted ? ' [aborted]' : ''}`;

    if (isError) this.logger.error(message, meta, 'HTTP');
    else this.logger.log(message, meta, 'HTTP');
  }
}
