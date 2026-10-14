import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AppEntityManager } from '#/core/database/entity-manager';
import { UnbanOperatorCommand } from '#/modules/operators/access/unban-operator.command';
import { UnbanOperatorResponseDto } from '#/modules/operators/access/unban-operator.response.dto';
import { findOperator } from '#/modules/operators/operator-actions.helpers';

@Injectable()
@CommandHandler(UnbanOperatorCommand)
export class UnbanOperatorHandler implements ICommandHandler<UnbanOperatorCommand, UnbanOperatorResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: UnbanOperatorCommand): Promise<UnbanOperatorResponseDto> {
    const operator = await findOperator(this.em, command.input.operatorId);
    operator.banned = false;
    operator.banReason = null;
    operator.banExpires = null;
    return UnbanOperatorResponseDto.parse({ ok: true });
  }
}
