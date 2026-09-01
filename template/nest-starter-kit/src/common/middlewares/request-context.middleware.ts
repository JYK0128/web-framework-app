import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { ClsService } from 'nestjs-cls';

const REQUEST_ID_HEADER = 'x-request-id';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly cls: ClsService) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const requestId = this.cls.getId();

    request.requestId = requestId;
    response.setHeader(REQUEST_ID_HEADER, requestId);

    next();
  }
}
