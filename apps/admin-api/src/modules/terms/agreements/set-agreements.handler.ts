import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { PrincipalContext } from '@pkg/server-core/http/contexts/principal.context';
import { ApplicationError } from '@pkg/shared/common';

import { User } from '#/core/database/entities/auth';
import { Term, UserTermAgreement } from '#/core/database/entities/terms';
import { AppEntityManager } from '#/core/database/entity-manager';
import { SetAgreementsCommand } from '#/modules/terms/agreements/set-agreements.command';
import { SetAgreementsResponseDto } from '#/modules/terms/agreements/set-agreements.response.dto';

@Injectable()
@CommandHandler(SetAgreementsCommand)
export class SetAgreementsHandler implements ICommandHandler<SetAgreementsCommand, SetAgreementsResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly principalContext: PrincipalContext,
  ) {}

  async execute(command: SetAgreementsCommand): Promise<SetAgreementsResponseDto> {
    const userId = this.principalContext.ensureUser().id;
    const termIds = command.input.agreements.map((agreement) => agreement.termId);
    const terms = await this.em.find(
      Term,
      { id: { $in: termIds }, publishedAt: { $ne: null, $lte: new Date() } },
      { populate: ['termGroup'] },
    );

    if (terms.length !== termIds.length) {
      throw new ApplicationError({ code: 'INVALID_TERM', status: HttpStatus.BAD_REQUEST });
    }

    const inputById = new Map(command.input.agreements.map((agreement) => [agreement.termId, agreement.isAgreed]));
    if (terms.some((term) => term.termGroup.isRequired && inputById.get(term.id) !== true)) {
      throw new ApplicationError({
        code: 'REQUIRED_TERM_NOT_AGREED',
        status: HttpStatus.BAD_REQUEST,
      });
    }

    for (const term of terms) {
      const input = command.input.agreements.find((agreement) => agreement.termId === term.id);
      const agreement = this.em.create(UserTermAgreement, {
        user: this.em.getReference(User, userId),
        term,
        isAgreed: input?.isAgreed === true,
        metadata: input?.metadata
          ? { options: input.metadata.options }
          : null,
      });
      this.em.persist(agreement);
    }

    return SetAgreementsResponseDto.parse({ ok: true });
  }
}
