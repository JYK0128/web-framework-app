import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AppEntityManager } from '#/database/entity-manager';
import { TermGroup } from '#/entities/terms/term-group.entity';
import { CreateTermGroupCommand } from '#/modules/terms/commands/create-term-group.command';
import { CreateTermGroupRequestDto, TermGroupItemDto } from '#/modules/terms/dto';

@Injectable()
@CommandHandler(CreateTermGroupCommand)
export class CreateTermGroupHandler implements ICommandHandler<CreateTermGroupCommand, TermGroupItemDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: CreateTermGroupCommand): Promise<TermGroupItemDto> {
    return this.process(command.input);
  }

  private process(input: CreateTermGroupRequestDto): TermGroupItemDto {
    const group = this.em.create(TermGroup, {
      code: input.code.trim(),
      title: input.title.trim(),
      isRequired: input.isRequired ?? true,
      sortOrder: input.sortOrder ?? 0,
    });
    this.em.persist(group);

    return new TermGroupItemDto(group);
  }
}
