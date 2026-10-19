import { Injectable, type NestMiddleware } from '@nestjs/common';
import { uuid } from '@pkg/shared/common';
import type { NextFunction, Request, Response } from 'express';
import { ClsService } from 'nestjs-cls';

export const REQUEST_ID_HEADER = 'x-request-id';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly cls: ClsService) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const incomingId = request.header(REQUEST_ID_HEADER);
    const requestId = incomingId || uuid();
    this.cls.set('requestId', requestId);
    this.cls.set('ipAddress', request.ip || request.socket.remoteAddress || null);
    this.cls.set('userAgent', request.get('user-agent')?.trim() || null);
    (request as unknown as { requestId?: string }).requestId = requestId;
    response.setHeader(REQUEST_ID_HEADER, requestId);

    next();
  }
}
