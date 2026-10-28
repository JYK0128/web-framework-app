import { HttpStatus, Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AppEntityManager } from '@pkg/server-core/core/persistence';
import { ApplicationError } from '@pkg/shared/common';

import { Faq } from '~/core/database/entities/faqs';
import { GetFaqQuery } from '~/modules/faq/get-faq.query';
import { GetFaqResponseDto } from '~/modules/faq/get-faq.response.dto';

@Injectable()
@QueryHandler(GetFaqQuery)
export class GetFaqHandler implements IQueryHandler<GetFaqQuery, GetFaqResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetFaqQuery): Promise<GetFaqResponseDto> {
    const faq = await this.em.findOne(Faq, { id: query.input.faqId, isPublished: true });
    if (!faq) {
      throw new ApplicationError({ code: 'FAQ_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return GetFaqResponseDto.parseEntity(faq);
  }
}
