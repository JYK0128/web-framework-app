import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export const Cookie = createParamDecorator(
  (name: string, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const cookieHeader = request.headers.cookie;
    if (!cookieHeader) return undefined;

    const prefix = `${name}=`;
    for (const cookie of cookieHeader.split(';')) {
      const trimmed = cookie.trim();
      if (trimmed.startsWith(prefix)) {
        return decodeURIComponent(trimmed.slice(prefix.length));
      }
    }
    return undefined;
  },
);
