import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import { CLS_REQ, ClsService } from 'nestjs-cls';

@Injectable()
export class RequestContext {
  constructor(private readonly cls: ClsService) {}

  get request(): Request | null { return this.cls.get<Request>(CLS_REQ) ?? null; }
  get response(): Response | null { return this.request?.res ?? null; }
  get session(): Request['session'] | null { return this.request?.session ?? null; }
  get requestId(): string | null { return this.cls.get<string>('requestId') ?? null; }
  get ipAddress(): string | null { return this.cls.get<string>('ipAddress') ?? null; }
  get userAgent(): string | null { return this.cls.get<string>('userAgent') ?? null; }
}
