import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { PrincipalContext } from '#/common/contexts/principal.context';
import { User } from '#/entities/auth/user.entity';
import { Term } from '#/entities/terms/term.entity';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { SetAgreementsCommand } from '#/modules/terms/commands';
import { SetAgreementsResponseDto } from '#/modules/terms/interfaces';

@Injectable()
@CommandHandler(SetAgreementsCommand)
export class SetAgreementsHandler implements ICommandHandler<SetAgreementsCommand, SetAgreementsResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly principalContext: PrincipalContext,
  ) {}

  async execute(command: SetAgreementsCommand): Promise<SetAgreementsResponseDto> {
    const userId = this.principalContext.ensureUser().id;
    const termIds = command.input.agreements.map((agreement) => agreement.id);
    const terms = await this.em.find(
      Term,
      { id: { $in: termIds }, publishedAt: { $ne: null, $lte: new Date() } },
      { populate: ['termGroup'] },
    );

    if (terms.length !== termIds.length) {
      throw new ApplicationError({ code: 'INVALID_TERM', status: HttpStatus.BAD_REQUEST });
    }

    const inputById = new Map(command.input.agreements.map((agreement) => [agreement.id, agreement.isAgreed]));
    if (terms.some((term) => term.termGroup.isRequired && inputById.get(term.id) !== true)) {
      throw new ApplicationError({
        code: 'REQUIRED_TERM_NOT_AGREED',
        status: HttpStatus.BAD_REQUEST,
        message: '필수 약관에 동의해야 합니다.',
      });
    }

    for (const term of terms) {
      const input = command.input.agreements.find((agreement) => agreement.id === term.id);
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

    return SetAgreementsResponseDto.fromPlain({});
  }
}
