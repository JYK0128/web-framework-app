import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Term } from '#/entities/terms/term.entity';
import { TermGroup } from '#/entities/terms/term-group.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { CreateTermCommand } from '#/modules/terms/commands/create-term.command';
import { CreateTermRequestDto, CreateTermResponseDto } from '#/modules/terms/dto';

@Injectable()
@CommandHandler(CreateTermCommand)
export class CreateTermHandler implements ICommandHandler<CreateTermCommand, CreateTermResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: CreateTermCommand): Promise<CreateTermResponseDto> {
    const group = await this.identifyGroup(command.input.termGroupId);
    await this.verifyNoVersionConflict(command.input.termGroupId, command.input.version);

    return this.process(group, command.input);
  }

  private async identifyGroup(groupId: string): Promise<TermGroup> {
    const group = await this.em.findOne(TermGroup, { id: groupId });
    if (!group) {
      throw new ApplicationError({ code: 'TERM_GROUP_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return group;
  }

  private async verifyNoVersionConflict(groupId: string, version: string): Promise<void> {
    const existing = await this.em.findOne(Term, { termGroup: groupId, version: version.trim() });
    if (existing) {
      throw new ApplicationError({ code: 'TERM_VERSION_ALREADY_EXISTS', status: HttpStatus.CONFLICT });
    }
  }

  private process(group: TermGroup, input: CreateTermRequestDto): CreateTermResponseDto {
    const term = this.em.create(Term, {
      termGroup: group,
      version: input.version.trim(),
      content: input.content.trim(),
      publishedAt: input.publishedAt,
    });
    this.em.persist(term);

    return new CreateTermResponseDto(term);
  }
}
