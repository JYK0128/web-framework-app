import { createParamDecorator, type ExecutionContext, HttpStatus } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import type { Request } from 'express';
import type { AuthPrincipal } from 'express-session';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthPrincipal => {
    const user = context.switchToHttp().getRequest<Request>().session.user;
    if (!user) throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });

    return user;
  },
);
