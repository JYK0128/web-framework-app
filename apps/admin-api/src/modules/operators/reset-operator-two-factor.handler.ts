import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { type IUserAuthService, USER_AUTH_SERVICE } from '#/core/auth/user/user-auth.interface';
import { TwoFactor } from '#/core/database/entities/auth.extensions';
import { AppEntityManager } from '#/core/database/entity-manager';
import { PrincipalContext } from '#/core/http/contexts/principal.context';
import { OperatorActionResponseDto } from '#/modules/operators';
import { assertSuperAdmin, findOperator, ok } from '#/modules/operators/operator-actions.helpers';
import { ResetOperatorTwoFactorCommand } from '#/modules/operators/reset-operator-two-factor.command';

@Injectable()
@CommandHandler(ResetOperatorTwoFactorCommand)
export class ResetOperatorTwoFactorHandler implements ICommandHandler<ResetOperatorTwoFactorCommand, OperatorActionResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext, @Inject(USER_AUTH_SERVICE) private readonly userAuthService: IUserAuthService) {}

  async execute(command: ResetOperatorTwoFactorCommand): Promise<OperatorActionResponseDto> {
    assertSuperAdmin(this.principal);
    const operator = await findOperator(this.em, command.input.operatorId);
    const twoFactor = await this.em.findOne(TwoFactor, { user: operator.id }, { filters: false });
    if (twoFactor) this.em.remove(twoFactor);
    operator.twoFactorEnabled = false;
    await this.userAuthService.revokeUserTokens?.(operator.id);
    return ok();
  }
}
