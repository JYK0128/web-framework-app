import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Term } from '#/core/database/entities/terms';
import { AppEntityManager } from '#/core/database/entity-manager';
import { InternalServiceTermItemDto, InternalServiceTermPageResponseDto } from '#/modules/service-terms/dto';
import { GetInternalServiceTermsQuery } from '#/modules/service-terms/queries';

@Injectable()
@QueryHandler(GetInternalServiceTermsQuery)
export class GetInternalServiceTermsHandler implements IQueryHandler<GetInternalServiceTermsQuery, InternalServiceTermPageResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input }: GetInternalServiceTermsQuery): Promise<InternalServiceTermPageResponseDto> {
    const result = await this.em.findByPage(Term, input.toFilterQuery(), {
      ...input.toPageOptions(),
      populate: ['termGroup'],
    });
    return InternalServiceTermPageResponseDto.parse({
      ...result,
      items: result.items.map((item) => InternalServiceTermItemDto.parseEntity(item)),
    });
  }
}
