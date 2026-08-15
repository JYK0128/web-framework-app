import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { AppEntityManager } from '#/database/entity-manager';
import { TermGroup } from '#/entities/terms/term-group.entity';
import { CreateTermGroupCommand } from '#/modules/terms/commands/create-term-group.command';
import { CreateTermGroupRequestDto, TermGroupItemDto } from '#/modules/terms/dto';

@Injectable()
@CommandHandler(CreateTermGroupCommand)
export class CreateTermGroupHandler implements ICommandHandler<CreateTermGroupCommand, TermGroupItemDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: CreateTermGroupCommand): Promise<TermGroupItemDto> {
    const code = command.input.code.trim();
    const duplicate = await this.identifyDuplicate(code);
    this.verifyNotDuplicate(duplicate);

    return this.process(command.input);
  }

  private async identifyDuplicate(code: string): Promise<TermGroup | null> {
    return this.em.findOne(TermGroup, { code }, { filters: false });
  }

  private verifyNotDuplicate(duplicate: TermGroup | null): void {
    if (duplicate) {
      throw new ApplicationError({ code: 'TERM_GROUP_CODE_ALREADY_EXISTS', status: HttpStatus.CONFLICT });
    }
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
