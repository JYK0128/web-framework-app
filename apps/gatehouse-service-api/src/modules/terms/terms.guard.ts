import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { QueryBus } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { ClsService } from 'nestjs-cls';

import { GetAgreementsQuery } from './queries/get-agreements.query';

const TERMS_EXCLUDED_CONTROLLERS = new Set(['auth', 'health', 'terms']);

@Injectable()
export class TermsAgreementGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly cls: ClsService,
    private readonly queryBus: QueryBus,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.isExcludedController(context)) return true;

    const user = this.cls.get('user');
    if (!user || user.isAnonymous) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }
    if (typeof user.metadata === 'object' && user.metadata !== null && user.metadata.isAdmin === true) {
      return true;
    }

    const { terms } = await this.queryBus.execute(new GetAgreementsQuery({}));
    const hasUnagreedRequiredTerm = terms.some(
      (term) => term.isRequired && !term.isAgreed,
    );

    if (!hasUnagreedRequiredTerm) return true;

    throw new ApplicationError({
      code: 'TERMS_AGREEMENT_REQUIRED',
      status: HttpStatus.FORBIDDEN,
    });
  }

  private isExcludedController(context: ExecutionContext): boolean {
    const metadata = this.reflector.get<string | string[]>('path', context.getClass());
    const paths = Array.isArray(metadata) ? metadata : [metadata];

    return paths.some((path) => {
      if (typeof path !== 'string') return false;
      const controllerPath = path.split('/').find((segment) => segment.length > 0);
      if (!controllerPath) return false;
      return TERMS_EXCLUDED_CONTROLLERS.has(controllerPath);
    });
  }
}
