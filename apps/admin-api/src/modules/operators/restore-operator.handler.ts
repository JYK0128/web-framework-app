import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { AppEntityManager } from '#/core/database/entity-manager';
import { PrincipalContext } from '#/core/http/contexts/principal.context';
import { OperatorActionResponseDto } from '#/modules/operators';
import { assertSuperAdmin, findOperator, ok } from '#/modules/operators/operator-actions.helpers';
import { RestoreOperatorCommand } from '#/modules/operators/restore-operator.command';

@Injectable()
@CommandHandler(RestoreOperatorCommand)
export class RestoreOperatorHandler implements ICommandHandler<RestoreOperatorCommand, OperatorActionResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}

  async execute(command: RestoreOperatorCommand): Promise<OperatorActionResponseDto> {
    assertSuperAdmin(this.principal);
    const operator = await findOperator(this.em, command.input.operatorId);
    if (!operator.deletedAt) {
      throw new ApplicationError({ code: 'OPERATOR_NOT_DELETED', status: HttpStatus.CONFLICT });
    }
    operator.deletedAt = null;
    operator.deletedBy = null;
    return ok();
  }
}
