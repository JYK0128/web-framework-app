import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { type IUserAuthService, USER_AUTH_SERVICE } from '#/core/auth/user/user-auth.interface';
import { AppEntityManager } from '#/core/database/entity-manager';
import { PrincipalContext } from '#/core/http/contexts/principal.context';
import { DeleteOperatorCommand } from '#/modules/operators/commands';
import { OperatorActionResponseDto } from '#/modules/operators/dto';
import { assertNotSelf, assertNotSuperAdmin, assertSuperAdmin, findOperator, ok } from '#/modules/operators/handlers/operator-actions.helpers';

@Injectable()
@CommandHandler(DeleteOperatorCommand)
export class DeleteOperatorHandler implements ICommandHandler<DeleteOperatorCommand, OperatorActionResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext, @Inject(USER_AUTH_SERVICE) private readonly userAuthService: IUserAuthService) {}

  async execute(command: DeleteOperatorCommand): Promise<OperatorActionResponseDto> {
    assertSuperAdmin(this.principal);
    const operator = await findOperator(this.em, command.input.operatorId);
    assertNotSelf(operator, this.principal);
    assertNotSuperAdmin(operator);
    operator.deletedAt = new Date();
    await this.userAuthService.revokeUserTokens?.(operator.id);
    return ok();
  }
}
