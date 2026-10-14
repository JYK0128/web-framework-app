import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { type IUserAuthService, USER_AUTH_SERVICE } from '@pkg/server-core/auth/user/user-auth.interface';
import { PrincipalContext } from '@pkg/server-core/http/contexts/principal.context';

import { AppEntityManager } from '#/core/database/entity-manager';
import { DeleteOperatorCommand } from '#/modules/operators/account/delete-operator.command';
import { DeleteOperatorResponseDto } from '#/modules/operators/account/delete-operator.response.dto';
import { assertNotSelf, assertNotSuperAdmin, findOperator } from '#/modules/operators/operator-actions.helpers';

@Injectable()
@CommandHandler(DeleteOperatorCommand)
export class DeleteOperatorHandler implements ICommandHandler<DeleteOperatorCommand, DeleteOperatorResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext, @Inject(USER_AUTH_SERVICE) private readonly userAuthService: IUserAuthService) {}

  async execute(command: DeleteOperatorCommand): Promise<DeleteOperatorResponseDto> {
    assertNotSelf(command.input.operatorId, this.principal);
    const operator = await findOperator(this.em, command.input.operatorId);
    assertNotSuperAdmin(operator);
    operator.deletedAt = new Date();
    await this.userAuthService.revokeUserTokens?.(operator.id);
    return DeleteOperatorResponseDto.parse({ ok: true });
  }
}
