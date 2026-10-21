import { HttpStatus, Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Term } from '~/core/database/entities/terms';
import { AppEntityManager } from '~/core/database/entity-manager';
import { GetServiceTermQuery } from '~/modules/service-term/document/get-service-term.query';
import { GetServiceTermResponseDto } from '~/modules/service-term/document/get-service-term.response.dto';
import { isPublished } from '~/modules/service-term/service-term.helpers';

@Injectable()
@QueryHandler(GetServiceTermQuery)
export class GetServiceTermHandler implements IQueryHandler<GetServiceTermQuery, GetServiceTermResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute(query: GetServiceTermQuery): Promise<GetServiceTermResponseDto> {
    const term = await this.em.findOne(Term, { id: query.input.termId }, { populate: ['termGroup'] });
    if (!term || !isPublished(term)) throw new ApplicationError({ code: 'SERVICE_TERM_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    return GetServiceTermResponseDto.parseEntity(term);
  }
}
