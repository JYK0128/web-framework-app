import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { Term } from '#/entities/terms/term.entity';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { SetServiceTermAgreementsCommand } from '#/modules/service-terms/commands';
import { SetServiceTermAgreementsResponseDto } from '#/modules/service-terms/dto';

import { isPublished } from './service-term.helpers';

@Injectable()
@CommandHandler(SetServiceTermAgreementsCommand)
export class SetServiceTermAgreementsHandler implements ICommandHandler<SetServiceTermAgreementsCommand, SetServiceTermAgreementsResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute(command: SetServiceTermAgreementsCommand): Promise<SetServiceTermAgreementsResponseDto> {
    for (const input of command.input.dto.agreements) {
      const term = await this.em.findOne(Term, { id: input.termId }, { populate: ['termGroup'] });
      if (!term || !isPublished(term)) continue;
      const agreement = await this.em.findOne(UserTermAgreement, { user: command.input.userId, term: term.id });
      if (agreement) agreement.isAgreed = input.isAgreed;
      else this.em.persist(this.em.create(UserTermAgreement, { user: command.input.userId, term: term.id, isAgreed: input.isAgreed }));
    }
    await this.em.flush();
    return { success: true };
  }
}
