import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { TermGroup } from '#/entities/terms/term-group.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { CreateTermGroupCommand } from '#/modules/terms/commands/create-term-group.command';
import { CreateTermGroupRequestDto, CreateTermGroupResponseDto } from '#/modules/terms/dto';

@Injectable()
@CommandHandler(CreateTermGroupCommand)
export class CreateTermGroupHandler implements ICommandHandler<CreateTermGroupCommand, CreateTermGroupResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: CreateTermGroupCommand): Promise<CreateTermGroupResponseDto> {
    const input = this.identify(command);
    this.verify(input);
    return this.process(input);
  }

  private identify(command: CreateTermGroupCommand): CreateTermGroupRequestDto {
    return {
      ...command.input,
      code: command.input.code.trim(),
      title: command.input.title.trim(),
    };
  }

  private verify(input: CreateTermGroupRequestDto): void {
    if (!input.code || !input.title) {
      throw new ApplicationError({ code: 'TERM_GROUP_INPUT_INVALID', status: HttpStatus.BAD_REQUEST });
    }
  }

  private process(input: CreateTermGroupRequestDto): CreateTermGroupResponseDto {
    const group = this.em.create(TermGroup, {
      code: input.code,
      title: input.title,
      isRequired: input.isRequired ?? true,
      sortOrder: input.sortOrder ?? 0,
    });
    this.em.persist(group);

    return CreateTermGroupResponseDto.from(group);
  }
}
