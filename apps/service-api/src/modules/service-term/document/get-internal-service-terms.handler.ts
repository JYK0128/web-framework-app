import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AppEntityManager } from '@pkg/server-core/core/persistence';

import { Term } from '~/core/database/entities/terms';
import { GetInternalServiceTermsQuery } from '~/modules/service-term/document/get-internal-service-terms.query';
import { GetInternalServiceTermsResponseDto } from '~/modules/service-term/document/get-internal-service-terms.response.dto';
import { InternalServiceTermItemDto } from '~/modules/service-term/document/internal-service-term-item.dto';

@Injectable()
@QueryHandler(GetInternalServiceTermsQuery)
export class GetInternalServiceTermsHandler implements IQueryHandler<GetInternalServiceTermsQuery, GetInternalServiceTermsResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input }: GetInternalServiceTermsQuery): Promise<GetInternalServiceTermsResponseDto> {
    const { where, ...options } = input.toQuery();
    const result = await this.em.findByPage(Term, where, {
      ...options,
      populate: ['termGroup'],
    });
    return GetInternalServiceTermsResponseDto.parse({
      ...result,
      items: result.items.map((item) => InternalServiceTermItemDto.parseEntity(item)),
    });
  }
}
