import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClsService } from 'nestjs-cls';

import { SKIP_SANITIZE_KEY } from '#/common/decorators/skip-sanitize.decorator';

@Injectable()
export class SanitizeContextGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly cls: ClsService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isSkip = this.reflector.getAllAndOverride<boolean>(SKIP_SANITIZE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isSkip) {
      this.cls.set('skipSanitize', true);
    }

    return true;
  }
}
