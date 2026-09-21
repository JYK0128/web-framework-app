import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Term } from '#/entities/terms/term.entity';
import { TermGroup } from '#/entities/terms/term-group.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { CreateTermCommand } from '#/modules/terms/commands';
import { CreateTermResponseDto, UserTermItemDto } from '#/modules/terms/interfaces';

@Injectable()
@CommandHandler(CreateTermCommand)
export class CreateTermHandler implements ICommandHandler<CreateTermCommand, CreateTermResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: CreateTermCommand): Promise<CreateTermResponseDto> {
    const input = command.input;
    const group = await this.em.findOne(TermGroup, { id: input.termGroupId });
    if (!group) {
      throw new ApplicationError({ code: 'TERM_GROUP_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    const duplicate = await this.em.findOne(Term, { termGroup: group, version: input.version.trim() });
    if (duplicate) {
      throw new ApplicationError({ code: 'TERM_VERSION_ALREADY_EXISTS', status: HttpStatus.CONFLICT });
    }

    const term = this.em.create(Term, {
      termGroup: group,
      version: input.version.trim(),
      content: input.content.trim(),
    });
    this.em.persist(term);
    return CreateTermResponseDto.fromPlain(UserTermItemDto.from(term));
  }
}
