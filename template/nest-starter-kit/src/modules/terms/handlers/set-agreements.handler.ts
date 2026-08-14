import { EntityManager } from '@mikro-orm/core';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { ClsService } from 'nestjs-cls';

import { User } from '#/entities/auth/user.entity';
import { Term } from '#/entities/terms/term.entity';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';
import { SetAgreementsCommand } from '#/modules/terms/commands/set-agreements.command';
import { SetAgreementsResponseDto } from '#/modules/terms/dto/set-agreements.response.dto';

@Injectable()
@CommandHandler(SetAgreementsCommand)
export class SetAgreementsHandler implements ICommandHandler<SetAgreementsCommand, SetAgreementsResponseDto> {
  constructor(
    @Inject(EntityManager) private readonly em: EntityManager,
    private readonly cls: ClsService,
  ) {}

  async execute(command: SetAgreementsCommand): Promise<SetAgreementsResponseDto> {
    const { agreements } = command.input;
    const currentUser = this.cls.get('user');
    if (!currentUser) throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });

    // 변경 대상이 없으면 바로 성공 처리합니다.
    if (agreements.length === 0) return { ok: true };

    // 전달된 약관만 상태를 변경합니다.
    const agreementMap = new Map(
      agreements.map(({ id, isAgreed }) => [id, isAgreed]),
    );
    const termIds = [...agreementMap.keys()];

    // 게시된 약관만 변경할 수 있습니다.
    const terms = await this.em.find(
      Term,
      { id: { $in: termIds }, publishedAt: { $ne: null, $lte: new Date() } },
      { populate: ['termGroup'] },
    );

    // 요청한 약관이 모두 게시됐는지 확인합니다.
    if (terms.length !== termIds.length) {
      throw new ApplicationError({ code: 'NO_PUBLISHED_TERM', status: HttpStatus.BAD_REQUEST });
    }

    // 필수 약관 철회 요청만 차단합니다.
    if (
      terms.some((term) =>
        agreementMap.get(term.id) === false
        && term.termGroup.isRequired)
    ) {
      throw new ApplicationError({ code: 'CANNOT_WITHDRAW_REQUIRED_TERM', status: HttpStatus.BAD_REQUEST });
    }

    const termGroupIds = terms.map((term) => term.termGroup.id);
    // 최신순으로 조회한 뒤 그룹별 첫 이력만 사용합니다.
    const currentAgreements = await this.em.find(
      UserTermAgreement,
      { user: currentUser.id, term: { termGroup: { $in: termGroupIds } } },
      { populate: ['term', 'term.termGroup'], orderBy: { createdAt: 'DESC' } },
    );
    const latestAgreementsByGroup = new Map<string, UserTermAgreement>();

    for (const agreement of currentAgreements) {
      if (!latestAgreementsByGroup.has(agreement.term.termGroup.id)) {
        latestAgreementsByGroup.set(agreement.term.termGroup.id, agreement);
      }
    }

    for (const term of terms) {
      const isAgreed = agreementMap.get(term.id) === true;
      const latestAgreement = latestAgreementsByGroup.get(term.termGroup.id);

      // 같은 상태는 중복 저장하지 않습니다.
      if (
        latestAgreement?.isAgreed === isAgreed
        && (!isAgreed || latestAgreement.term.id === term.id)
      ) continue;

      // 기존 이력은 보존하고 새 이력을 추가합니다.
      this.em.persist(this.em.create(UserTermAgreement, {
        user: this.em.getReference(User, currentUser.id),
        term,
        isAgreed,
      }));
    }

    return { ok: true };
  }
}
