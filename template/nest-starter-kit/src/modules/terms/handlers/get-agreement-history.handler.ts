import { EntityManager } from '@mikro-orm/core';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { ClsService } from 'nestjs-cls';

import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';
import { GetAgreementHistoryResponseDto } from '#/modules/terms/dto/get-agreement-history.response.dto';
import { GetAgreementHistoryQuery } from '#/modules/terms/queries/get-agreement-history.query';

@Injectable()
@QueryHandler(GetAgreementHistoryQuery)
export class GetAgreementHistoryHandler implements IQueryHandler<GetAgreementHistoryQuery, GetAgreementHistoryResponseDto> {
  constructor(
    @Inject(EntityManager) private readonly em: EntityManager,
    private readonly cls: ClsService,
  ) {}

  async execute(): Promise<GetAgreementHistoryResponseDto> {
    const currentUser = this.cls.get('user');
    if (!currentUser) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }

    const agreements = await this.em.find(
      UserTermAgreement,
      { user: currentUser.id },
      {
        populate: ['term', 'term.termGroup'],
        orderBy: { createdAt: 'DESC' },
      },
    );

    return {
      items: agreements.map((agreement) => ({
        id: agreement.id,
        termId: agreement.term.id,
        version: agreement.term.version,
        content: agreement.term.content,
        publishedAt: agreement.term.publishedAt ?? null,
        code: agreement.term.termGroup.code,
        title: agreement.term.termGroup.title,
        isRequired: agreement.term.termGroup.isRequired,
        isAgreed: agreement.isAgreed,
        createdAt: agreement.createdAt,
      })),
    };
  }
}
