import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { AppEntityManager } from '@pkg/server-core/core/persistence';
import { ApplicationError } from '@pkg/shared/common';

import { RestoreOperatorCommand } from '~/modules/operator/account/restore-operator.command';
import { RestoreOperatorResponseDto } from '~/modules/operator/account/restore-operator.response.dto';
import { findOperator } from '~/modules/operator/operator-actions.helpers';

@Injectable()
@CommandHandler(RestoreOperatorCommand)
export class RestoreOperatorHandler implements ICommandHandler<RestoreOperatorCommand, RestoreOperatorResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: RestoreOperatorCommand): Promise<RestoreOperatorResponseDto> {
    const operator = await findOperator(this.em, command.input.operatorId);
    if (!operator.deletedAt) {
      throw new ApplicationError({ code: 'OPERATOR_NOT_DELETED', status: HttpStatus.CONFLICT });
    }
    operator.deletedAt = null;
    operator.deletedBy = null;
    return RestoreOperatorResponseDto.ok();
  }
}
