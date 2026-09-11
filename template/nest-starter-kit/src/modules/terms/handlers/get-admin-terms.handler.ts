import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Term } from '#/entities/terms/term.entity';
import { AppEntityManager, type PageResult } from '#/infra/database/entity-manager';
import { AdminTermItemDto, GetAdminTermsRequestDto, GetAdminTermsResponseDto } from '#/modules/terms/dto';
import { GetAdminTermsQuery } from '#/modules/terms/queries/get-admin-terms.query';

@Injectable()
@QueryHandler(GetAdminTermsQuery)
export class GetAdminTermsHandler implements IQueryHandler<GetAdminTermsQuery, GetAdminTermsResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetAdminTermsQuery): Promise<GetAdminTermsResponseDto> {
    const pageResult = await this.identifyTerms(query.input);
    this.verify(pageResult);
    return this.process(pageResult);
  }

  private verify(pageResult: PageResult<Term>): void {
    if (!Array.isArray(pageResult.items)) {
      throw new Error('약관 목록을 확인할 수 없습니다.');
    }
  }

  private async identifyTerms(query: GetAdminTermsRequestDto): Promise<PageResult<Term>> {
    return this.em.findByPage(Term, query.toFilterQuery(), {
      ...query.toPageOptions(),
      populate: ['termGroup'],
    });
  }

  private process(pageResult: PageResult<Term>): GetAdminTermsResponseDto {
    return GetAdminTermsResponseDto.fromPlain({
      ...pageResult,
      items: pageResult.items.map((term) => AdminTermItemDto.fromPlain({
        id: term.id,
        version: term.version,
        content: term.content,
        publishedAt: term.publishedAt,
        isPublished: term.isPublished,
        isDraft: term.isDraft,
        termGroup: {
          code: term.termGroup.code,
          title: term.termGroup.title,
          isRequired: term.termGroup.isRequired,
          sortOrder: term.termGroup.sortOrder,
        },
        createdAt: term.createdAt,
        updatedAt: term.updatedAt,
      })),
    });
  }
}
