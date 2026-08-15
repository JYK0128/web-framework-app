import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { isValid } from 'date-fns';

import { AppEntityManager } from '#/database/entity-manager';
import { Term } from '#/entities/terms/term.entity';
import { UpdateTermCommand } from '#/modules/terms/commands/update-term.command';
import { AdminTermDto, UpdateTermRequestDto } from '#/modules/terms/dto';

@Injectable()
@CommandHandler(UpdateTermCommand)
export class UpdateTermHandler implements ICommandHandler<UpdateTermCommand, AdminTermDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: UpdateTermCommand): Promise<AdminTermDto> {
    const term = await this.identify(command.id);
    this.verifyNotPublished(term);

    const version = command.input.version?.trim() ?? term.version;
    const duplicate = await this.identifyDuplicate(term.termGroup.id, version, term.id);
    this.verifyNotDuplicate(duplicate);

    return this.process(term, version, command.input);
  }

  private async identify(id: string): Promise<Term> {
    const term = await this.em.findOne(Term, { id }, { populate: ['termGroup'], filters: false });
    if (!term || term.deletedAt) {
      throw new ApplicationError({ code: 'TERM_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return term;
  }

  private verifyNotPublished(term: Term): void {
    if (term.isPublished) {
      throw new ApplicationError({ code: 'PUBLISHED_TERM_CANNOT_BE_MODIFIED', status: HttpStatus.CONFLICT });
    }
  }

  private async identifyDuplicate(termGroupId: string, version: string, currentId: string): Promise<Term | null> {
    return this.em.findOne(Term, {
      termGroup: termGroupId,
      version,
      id: { $ne: currentId },
    });
  }

  private verifyNotDuplicate(duplicate: Term | null): void {
    if (duplicate) {
      throw new ApplicationError({ code: 'TERM_VERSION_ALREADY_EXISTS', status: HttpStatus.CONFLICT });
    }
  }

  private process(term: Term, version: string, input: UpdateTermRequestDto): AdminTermDto {
    term.version = version;
    if (input.content !== undefined) term.content = input.content.trim();
    if (input.publishedAt !== undefined) term.publishedAt = this.parsePublishedAt(input.publishedAt);

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
