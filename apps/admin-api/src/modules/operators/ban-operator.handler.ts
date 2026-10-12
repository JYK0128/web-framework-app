import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { type IUserAuthService, USER_AUTH_SERVICE } from '#/core/auth/user/user-auth.interface';
import { AppEntityManager } from '#/core/database/entity-manager';
import { PrincipalContext } from '#/core/http/contexts/principal.context';
import { OperatorActionResponseDto } from '#/modules/operators';
import { BanOperatorCommand } from '#/modules/operators/ban-operator.command';
import { assertNotSelf, assertNotSuperAdmin, assertSuperAdmin, findOperator, ok } from '#/modules/operators/operator-actions.helpers';

@Injectable()
@CommandHandler(BanOperatorCommand)
export class BanOperatorHandler implements ICommandHandler<BanOperatorCommand, OperatorActionResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext, @Inject(USER_AUTH_SERVICE) private readonly userAuthService: IUserAuthService) {}

  async execute(command: BanOperatorCommand): Promise<OperatorActionResponseDto> {
    assertSuperAdmin(this.principal);
    const operator = await findOperator(this.em, command.input.operatorId);
    assertNotSelf(operator, this.principal);
    assertNotSuperAdmin(operator);
    if (command.input.data.expiresAt && command.input.data.expiresAt <= new Date()) {
      throw new ApplicationError({ code: 'BAN_EXPIRY_MUST_BE_FUTURE', status: HttpStatus.BAD_REQUEST });
    }
    operator.banned = true;
    operator.banReason = command.input.data.reason?.trim() || null;
    operator.banExpires = command.input.data.expiresAt ?? null;
    await this.userAuthService.revokeUserTokens?.(operator.id);
    return ok();
  }
}
