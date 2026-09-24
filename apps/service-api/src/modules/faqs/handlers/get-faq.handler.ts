import { HttpStatus, Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Faq } from '#/entities/faqs/faq.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { FaqDetailResponseDto } from '#/modules/faqs/dto';
import { GetFaqQuery } from '#/modules/faqs/queries';

@Injectable()
@QueryHandler(GetFaqQuery)
export class GetFaqHandler implements IQueryHandler<GetFaqQuery, FaqDetailResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetFaqQuery): Promise<FaqDetailResponseDto> {
    const faq = await this.em.findOne(Faq, { id: query.input.faqId, isPublished: true });
    if (!faq) {
      throw new ApplicationError({ code: 'FAQ_NOT_FOUND', message: '공개된 FAQ를 찾을 수 없습니다.', status: HttpStatus.NOT_FOUND });
    }
    return FaqDetailResponseDto.fromPlain(faq);
  }
}
