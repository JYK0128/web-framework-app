import { HttpStatus, Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Term } from '#/core/database/entities/terms';
import { AppEntityManager } from '#/core/database/entity-manager';
import { GetTermQuery } from '#/modules/terms/documents/get-term.query';
import { GetTermResponseDto } from '#/modules/terms/documents/get-term.response.dto';

@Injectable()
@QueryHandler(GetTermQuery)
export class GetTermHandler implements IQueryHandler<GetTermQuery, GetTermResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetTermQuery): Promise<GetTermResponseDto> {
    const term = await this.em.findOne(Term, { id: query.input.termId, publishedAt: { $ne: null, $lte: new Date() } }, { populate: ['termGroup'] });
    if (!term) throw new ApplicationError({ code: 'TERM_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    return GetTermResponseDto.parseEntity(term);
  }
}
