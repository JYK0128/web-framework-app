import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { QueryBus } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { ClsService } from 'nestjs-cls';

import { BYPASS_KEY, BypassPolicy, type BypassPolicy as BypassPolicyType } from '#/common/decorators/bypass.decorator';
import { IS_PUBLIC_KEY } from '#/common/decorators/public.decorator';

import { GetAgreementsQuery } from './queries/get-agreements.query';

@Injectable()
export class TermsAgreementGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly cls: ClsService,
    private readonly queryBus: QueryBus,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const bypassPolicies = this.reflector.getAllAndOverride<BypassPolicyType[]>(BYPASS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) ?? [];
    if (bypassPolicies.includes(BypassPolicy.TERM)) return true;

    const user = this.cls.get('user');
    if (!user) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
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
}
