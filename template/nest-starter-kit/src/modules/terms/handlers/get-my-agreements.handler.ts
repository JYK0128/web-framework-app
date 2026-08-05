import { EntityManager } from '@mikro-orm/core';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { ClsService } from 'nestjs-cls';

import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';
import { GetMyAgreementsResponseDto } from '#/modules/terms/dto/get-my-agreements.response.dto';
import { GetMyAgreementsQuery } from '#/modules/terms/queries/get-my-agreements.query';

@Injectable()
@QueryHandler(GetMyAgreementsQuery)
export class GetMyAgreementsHandler implements IQueryHandler<GetMyAgreementsQuery, GetMyAgreementsResponseDto> {
  constructor(
    @Inject(EntityManager) private readonly em: EntityManager,
    private readonly cls: ClsService,
  ) {}

  async execute(_query: GetMyAgreementsQuery): Promise<GetMyAgreementsResponseDto> {
    const sessionUser = this.cls.get('user');
    if (!sessionUser) throw new ApplicationError({ code: 'UNAUTHORIZED', status: HttpStatus.UNAUTHORIZED });
    const userId = sessionUser.id;

    const agreements = await this.em.find(
      UserTermAgreement,
      { user: userId },
      { populate: ['term', 'term.termGroup'] },
    );

    return {
      terms: agreements.map((a) => ({
        termGroupId: a.term.termGroup.id,
        termGroupCode: a.term.termGroup.code,
        termGroupName: a.term.termGroup.name,
        isRequired: a.term.termGroup.isRequired,
        termId: a.term.id,
        termVersion: a.term.version,
        agreedAt: a.agreedAt,
      })),
    };
  }
}
