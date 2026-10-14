import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { type IUserAuthService, USER_AUTH_SERVICE } from '@pkg/server-core/auth/user/user-auth.interface';
import { PrincipalContext } from '@pkg/server-core/http/contexts/principal.context';
import { ApplicationError } from '@pkg/shared/common';

import { AppEntityManager } from '#/core/database/entity-manager';
import { BanOperatorCommand } from '#/modules/operator/access/ban-operator.command';
import { BanOperatorResponseDto } from '#/modules/operator/access/ban-operator.response.dto';
import { assertNotSelf, assertNotSuperAdmin, findOperator } from '#/modules/operator/operator-actions.helpers';

@Injectable()
@CommandHandler(BanOperatorCommand)
export class BanOperatorHandler implements ICommandHandler<BanOperatorCommand, BanOperatorResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext, @Inject(USER_AUTH_SERVICE) private readonly userAuthService: IUserAuthService) {}

  async execute(command: BanOperatorCommand): Promise<BanOperatorResponseDto> {
    assertNotSelf(command.input.operatorId, this.principal);
    const operator = await findOperator(this.em, command.input.operatorId);
    assertNotSuperAdmin(operator);
    if (command.input.data.expiresAt && command.input.data.expiresAt <= new Date()) {
      throw new ApplicationError({ code: 'BAN_EXPIRY_MUST_BE_FUTURE', status: HttpStatus.BAD_REQUEST });
    }
    operator.banned = true;
    operator.banReason = command.input.data.reason?.trim() || null;
    operator.banExpires = command.input.data.expiresAt ?? null;
    await this.userAuthService.revokeUserTokens?.(operator.id);
    return BanOperatorResponseDto.ok();
  }
}
