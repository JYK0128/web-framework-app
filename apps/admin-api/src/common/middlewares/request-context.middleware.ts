import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { ClsService } from 'nestjs-cls';

export const REQUEST_ID_HEADER = 'x-request-id';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly cls: ClsService) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const incomingId = request.header(REQUEST_ID_HEADER);
    const requestId = incomingId || this.cls.getId();

    (request as unknown as { requestId?: string }).requestId = requestId;
    response.setHeader(REQUEST_ID_HEADER, requestId);

    next();
  }
}
