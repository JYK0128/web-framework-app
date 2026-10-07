import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

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
    const inputs = command.input.dto.agreements;
    const terms = await this.em.find(Term, { id: { $in: inputs.map((input) => input.termId) } }, { populate: ['termGroup'] });
    if (terms.length !== inputs.length || terms.some((term) => !isPublished(term))) throw new BadRequestException('게시된 약관만 동의할 수 있습니다.');
    if (terms.some((term) => term.termGroup.isRequired && inputs.find((input) => input.termId === term.id)?.isAgreed !== true)) {
      throw new ApplicationError({ code: 'REQUIRED_TERM_NOT_AGREED', status: HttpStatus.BAD_REQUEST });
    }
    const records: UserTermAgreement[] = [];
    for (const input of inputs) {
      const term = terms.find((item) => item.id === input.termId)!;
      const definitions = term.metadata?.options as Record<string, boolean | null> | undefined;
      const submitted = input.metadata?.options ?? {};
      if (Object.keys(submitted).some((key) => !Object.hasOwn(definitions ?? {}, key))) throw new BadRequestException('지원하지 않는 수신 옵션입니다.');
      const previous = await this.em.findOne(UserTermAgreement, { user: command.input.userId, term: term.id }, { orderBy: { createdAt: 'desc', id: 'desc' } });
      const previousOptions = previous?.metadata?.options as Record<string, boolean | null> | undefined;
      const options = Object.fromEntries(Object.keys(definitions ?? {}).map((key) => [key, input.isAgreed && (submitted[key] ?? previousOptions?.[key] ?? false)]));
      records.push(this.em.create(UserTermAgreement, { user: command.input.userId, term: term.id, isAgreed: input.isAgreed, metadata: definitions ? { options } : null }));
    }
    this.em.persist(records);
    await this.em.flush();
    return SetServiceTermAgreementsResponseDto.fromPlain({ ok: true });
  }
}
