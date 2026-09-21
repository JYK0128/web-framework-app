import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { TermGroup } from '#/entities/terms/term-group.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { CreateTermGroupCommand } from '#/modules/terms/commands';
import { CreateTermGroupResponseDto, UserTermGroupItemDto } from '#/modules/terms/interfaces';

@Injectable()
@CommandHandler(CreateTermGroupCommand)
export class CreateTermGroupHandler implements ICommandHandler<CreateTermGroupCommand, CreateTermGroupResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: CreateTermGroupCommand): Promise<CreateTermGroupResponseDto> {
    const input = command.input;
    const duplicate = await this.em.findOne(TermGroup, { code: input.code.trim() });
    if (duplicate) throw new ApplicationError({ code: 'TERM_GROUP_CODE_ALREADY_EXISTS', status: HttpStatus.CONFLICT });
    const group = this.em.create(TermGroup, {
      code: input.code.trim(),
      title: input.title.trim(),
      isRequired: input.isRequired ?? true,
      sortOrder: input.sortOrder ?? 0,
    });
    this.em.persist(group);
    return CreateTermGroupResponseDto.fromPlain(UserTermGroupItemDto.from(group));
  }
}
