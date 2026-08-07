import { HttpStatus, Injectable, type NestMiddleware } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import type { NextFunction, Request, Response } from 'express';

import { validateRequest } from '#/common/security/csrf';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(request: Request, _response: Response, next: NextFunction): void {
    if (!SAFE_METHODS.has(request.method) && !validateRequest(request)) {
      next(new ApplicationError({
        code: 'CSRF_TOKEN_INVALID',
        status: HttpStatus.FORBIDDEN,
      }));
      return;
    }

    next();
  }
}
