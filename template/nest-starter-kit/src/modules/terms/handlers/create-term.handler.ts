import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { AppEntityManager } from '#/database/entity-manager';
import { Term } from '#/entities/terms/term.entity';
import { TermGroup } from '#/entities/terms/term-group.entity';
import { CreateTermCommand } from '#/modules/terms/commands/create-term.command';
import { AdminTermDto, CreateTermRequestDto } from '#/modules/terms/dto';

@Injectable()
@CommandHandler(CreateTermCommand)
export class CreateTermHandler implements ICommandHandler<CreateTermCommand, AdminTermDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: CreateTermCommand): Promise<AdminTermDto> {
    const group = await this.identifyGroup(command.input.termGroupId);
    return this.process(group, command.input);
  }

  private async identifyGroup(id: string): Promise<TermGroup> {
    const group = await this.em.findOne(TermGroup, { id }, { filters: false });
    if (!group || group.deletedAt) {
      throw new ApplicationError({ code: 'TERM_GROUP_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return group;
  }

  private process(group: TermGroup, input: CreateTermRequestDto): AdminTermDto {
    const term = this.em.create(Term, {
      termGroup: group,
      version: input.version.trim(),
      content: input.content.trim(),
      publishedAt: input.publishedAt,
    });
    this.em.persist(term);

    return new AdminTermDto(term);
  }
}
