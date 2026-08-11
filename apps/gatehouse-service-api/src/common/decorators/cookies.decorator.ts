import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

type Cookies = Record<string, string | undefined>;

export const Cookie = createParamDecorator(
  (name: string | undefined, context: ExecutionContext): string | undefined => {
    const request = context.switchToHttp().getRequest<Request>();
    const cookies = request.cookies as Cookies | undefined;
    return name ? cookies?.[name] : undefined;
  },
);

export const Cookies = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Cookies => {
    const request = context.switchToHttp().getRequest<Request>();
    return (request.cookies ?? {}) as Cookies;
  },
);
