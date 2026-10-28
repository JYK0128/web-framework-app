import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { type IUserAuthService, USER_AUTH_SERVICE } from '@pkg/server-core/auth';
import { AppEntityManager } from '@pkg/server-core/core/persistence';

import { TwoFactor } from '~/core/database/entities/auth.extensions';
import { ResetOperatorTwoFactorCommand } from '~/modules/operator/access/reset-operator-two-factor.command';
import { ResetOperatorTwoFactorResponseDto } from '~/modules/operator/access/reset-operator-two-factor.response.dto';
import { findOperator } from '~/modules/operator/operator-actions.helpers';

@Injectable()
@CommandHandler(ResetOperatorTwoFactorCommand)
export class ResetOperatorTwoFactorHandler implements ICommandHandler<ResetOperatorTwoFactorCommand, ResetOperatorTwoFactorResponseDto> {
  constructor(private readonly em: AppEntityManager, @Inject(USER_AUTH_SERVICE) private readonly userAuthService: IUserAuthService) {}

  async execute(command: ResetOperatorTwoFactorCommand): Promise<ResetOperatorTwoFactorResponseDto> {
    const operator = await findOperator(this.em, command.input.operatorId);
    const twoFactor = await this.em.findOne(TwoFactor, { user: operator.id }, { filters: false });
    if (twoFactor) this.em.remove(twoFactor);
    operator.twoFactorEnabled = false;
    await this.userAuthService.revokeUserTokens?.(operator.id);
    return ResetOperatorTwoFactorResponseDto.ok();
  }
}
