import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { QueryBus } from '@nestjs/cqrs';
import type { Request } from 'express';

import { requestContext } from '#/common/context/request-context';
import { IS_PUBLIC_KEY } from '#/common/decorators/public.decorator';

import type { PublicUser } from './auth.types';
import { GetCurrentUserQuery } from './queries/get-current-user.query';
import { readSessionToken } from './session-cookie';

type RequestWithUser = Request & { user?: PublicUser };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = await this.queryBus.execute(new GetCurrentUserQuery(readSessionToken(request)));
    if (!user) {
      throw new UnauthorizedException({ code: 'AUTHENTICATION_REQUIRED', message: 'Authentication is required' });
    }

    request.user = user;
    requestContext.setActorId(user.id);
    return true;
  }
}
