import { HttpStatus, Injectable } from '@nestjs/common';
import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { Term } from '#/entities/terms/term.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { ServiceTermDetailResponseDto } from '../dto';
import { GetServiceTermQuery } from '../queries';
import { isPublished, toServiceTerm } from './service-term.helpers';

@Injectable()
@QueryHandler(GetServiceTermQuery)
export class GetServiceTermHandler implements IQueryHandler<GetServiceTermQuery, ServiceTermDetailResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute(query: GetServiceTermQuery): Promise<ServiceTermDetailResponseDto> {
    const term = await this.em.findOne(Term, { id: query.input.termId }, { populate: ['termGroup'] });
    if (!term || !isPublished(term)) throw new ApplicationError({ code: 'SERVICE_TERM_NOT_FOUND', message: '게시된 서비스 약관을 찾을 수 없습니다.', status: HttpStatus.NOT_FOUND });
    return toServiceTerm(term) as ServiceTermDetailResponseDto;
  }
}
