import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AppEntityManager } from '#/core/database/entity-manager';
import { PrincipalContext } from '#/core/http/contexts/principal.context';
import { UnbanOperatorCommand } from '#/modules/operators/commands';
import { OperatorActionResponseDto } from '#/modules/operators/dto';
import { assertSuperAdmin, findOperator, ok } from '#/modules/operators/handlers/operator-actions.helpers';

@Injectable()
@CommandHandler(UnbanOperatorCommand)
export class UnbanOperatorHandler implements ICommandHandler<UnbanOperatorCommand, OperatorActionResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}

  async execute(command: UnbanOperatorCommand): Promise<OperatorActionResponseDto> {
    assertSuperAdmin(this.principal);
    const operator = await findOperator(this.em, command.input.operatorId);
    operator.banned = false;
    operator.banReason = null;
    operator.banExpires = null;
    return ok();
  }
}
