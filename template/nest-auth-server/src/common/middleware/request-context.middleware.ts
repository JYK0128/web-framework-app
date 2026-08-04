import { randomUUID } from 'node:crypto';

import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import { requestContext } from '#/common/context/request-context';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction): void {
    const requestId = request.header('x-request-id')?.trim() || randomUUID();
    response.setHeader('x-request-id', requestId);

    requestContext.run({
      requestId,
      actorId: null,
      tracking: {
        ipAddress: request.ip || request.header('x-forwarded-for')?.split(',')[0]?.trim() || null,
        userAgent: request.header('user-agent') || null,
        referer: request.header('referer') || request.header('referrer') || null,
        origin: request.header('origin') || null,
        acceptLanguage: request.header('accept-language') || null,
        secChUa: request.header('sec-ch-ua') || null,
        secChUaMobile: request.header('sec-ch-ua-mobile') || null,
        secChUaPlatform: request.header('sec-ch-ua-platform') || null,
        doNotTrack: request.header('dnt') || null,
      },
    }, next);
  }
}
