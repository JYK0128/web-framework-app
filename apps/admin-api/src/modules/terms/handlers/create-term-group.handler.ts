import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { TermGroup } from '#/entities/terms/term-group.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { CreateTermGroupCommand } from '#/modules/terms/commands';
import { CreateTermGroupResponseDto, OperatorTermGroupItemDto } from '#/modules/terms/interfaces';

@Injectable()
@CommandHandler(CreateTermGroupCommand)
export class CreateTermGroupHandler implements ICommandHandler<CreateTermGroupCommand, CreateTermGroupResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: CreateTermGroupCommand): Promise<CreateTermGroupResponseDto> {
    const input = command.input;
    const group = this.em.create(TermGroup, {
      title: input.title.trim(),
      isRequired: input.isRequired ?? true,
      sortOrder: input.sortOrder ?? 0,
    });
    this.em.persist(group);
    return CreateTermGroupResponseDto.fromPlain(OperatorTermGroupItemDto.from(group));
  }
}
