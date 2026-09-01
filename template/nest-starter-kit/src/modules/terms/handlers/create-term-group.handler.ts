import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { TermGroup } from '#/entities/terms/term-group.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { CreateTermGroupCommand } from '#/modules/terms/commands/create-term-group.command';
import { CreateTermGroupRequestDto, CreateTermGroupResponseDto } from '#/modules/terms/dto';

@Injectable()
@CommandHandler(CreateTermGroupCommand)
export class CreateTermGroupHandler implements ICommandHandler<CreateTermGroupCommand, CreateTermGroupResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: CreateTermGroupCommand): Promise<CreateTermGroupResponseDto> {
    return this.process(command.input);
  }

  private process(input: CreateTermGroupRequestDto): CreateTermGroupResponseDto {
    const group = this.em.create(TermGroup, {
      code: input.code.trim(),
      title: input.title.trim(),
      isRequired: input.isRequired ?? true,
      sortOrder: input.sortOrder ?? 0,
    });
    this.em.persist(group);

    return new CreateTermGroupResponseDto(group);
  }
}
