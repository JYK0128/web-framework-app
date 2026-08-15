import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { isValid } from 'date-fns';

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
    const version = command.input.version.trim();
    const duplicate = await this.identifyDuplicate(group.id, version);
    this.verifyNotDuplicate(duplicate);

    return this.process(group, version, command.input);
  }

  private async identifyGroup(id: string): Promise<TermGroup> {
    const group = await this.em.findOne(TermGroup, { id }, { filters: false });
    if (!group || group.deletedAt) {
      throw new ApplicationError({ code: 'TERM_GROUP_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return group;
  }

  private async identifyDuplicate(termGroupId: string, version: string): Promise<Term | null> {
    return this.em.findOne(Term, { termGroup: termGroupId, version });
  }

  private verifyNotDuplicate(duplicate: Term | null): void {
    if (duplicate) {
      throw new ApplicationError({ code: 'TERM_VERSION_ALREADY_EXISTS', status: HttpStatus.CONFLICT });
    }
  }

  private process(group: TermGroup, version: string, input: CreateTermRequestDto): AdminTermDto {
    const term = this.em.create(Term, {
      termGroup: group,
      version,
      content: input.content.trim(),
      publishedAt: this.parsePublishedAt(input.publishedAt),
    });
    this.em.persist(term);

    return new AdminTermDto(term);
  }

  private parsePublishedAt(value: Date | null | undefined): Date | null {
    if (value === undefined || value === null) return null;
    if (!isValid(value)) {
      throw new ApplicationError({ code: 'INVALID_PUBLISHED_AT', status: HttpStatus.BAD_REQUEST });
    }
    return value;
  }
}
