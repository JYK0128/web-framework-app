import { HttpStatus, Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Term } from '#/entities/terms/term.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { OperatorTermDetailResponseDto, OperatorTermItemDto } from '#/modules/terms/interfaces';
import { GetOperatorTermQuery } from '#/modules/terms/queries';

@Injectable()
@QueryHandler(GetOperatorTermQuery)
export class GetOperatorTermHandler implements IQueryHandler<GetOperatorTermQuery, OperatorTermDetailResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetOperatorTermQuery): Promise<OperatorTermDetailResponseDto> {
    const term = await this.em.findOne(Term, { id: query.input.termId, publishedAt: { $ne: null, $lte: new Date() } }, { populate: ['termGroup'] });
    if (!term) throw new ApplicationError({ code: 'TERM_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    return OperatorTermDetailResponseDto.fromPlain(OperatorTermItemDto.from(term));
  }
}
