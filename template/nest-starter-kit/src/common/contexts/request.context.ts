import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { CLS_REQ, ClsService } from 'nestjs-cls';

@Injectable()
export class RequestContext {
  constructor(private readonly cls: ClsService) {}

  get request(): Request | null {
    if (!this.cls.isActive()) return null;
    return this.cls.get<Request>(CLS_REQ) ?? null;
  }
}
