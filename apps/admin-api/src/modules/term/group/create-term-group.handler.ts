import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { AppEntityManager } from '@pkg/server-core/core/persistence';

import { TermGroup } from '~/core/database/entities/terms';
import { CreateTermGroupCommand } from '~/modules/term/group/create-term-group.command';
import { CreateTermGroupResponseDto } from '~/modules/term/group/create-term-group.response.dto';

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
    return CreateTermGroupResponseDto.parseEntity(group);
  }
}
