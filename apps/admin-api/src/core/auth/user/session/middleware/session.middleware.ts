import type { NestMiddleware, Type } from '@nestjs/common';

export abstract class SessionMiddleware implements NestMiddleware {
  abstract use(request: unknown, response: unknown, next: (error?: unknown) => void): void;
}

export const SESSION_MIDDLEWARE_TYPE = Symbol('SESSION_MIDDLEWARE_TYPE');
export type SessionMiddlewareType = Type<SessionMiddleware>;
