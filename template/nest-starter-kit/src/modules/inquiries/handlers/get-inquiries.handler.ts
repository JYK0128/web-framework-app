import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { SessionContext } from '#/common/contexts/session.context';
import { Inquiry } from '#/entities/inquiries/inquiry.entity';
import { AppEntityManager, type PageResult } from '#/infra/database/entity-manager';
import { GetInquiriesResponseDto, InquiryItemDto } from '#/modules/inquiries/dto';
import { GetInquiriesQuery } from '#/modules/inquiries/queries';

@Injectable()
@QueryHandler(GetInquiriesQuery)
export class GetInquiriesHandler implements IQueryHandler<GetInquiriesQuery, GetInquiriesResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly sessionContext: SessionContext,
  ) {}

  async execute(query: GetInquiriesQuery): Promise<GetInquiriesResponseDto> {
    const pageResult = await this.identifyInquiries(query);
    this.verify(pageResult);
    return this.process(pageResult);
  }

  private verify(pageResult: PageResult<Inquiry>): void {
    if (!Array.isArray(pageResult.items)) {
      throw new Error('문의 목록을 확인할 수 없습니다.');
    }
  }

  private async identifyInquiries(query: GetInquiriesQuery): Promise<PageResult<Inquiry>> {
    return this.em.findByPage(
      Inquiry,
      { $and: [{ user: this.sessionContext.requiredUser.id }, query.input.toFilterQuery()] },
      {
        ...query.input.toPageOptions(),
        populate: ['user', 'assignee'],
      },
    );
  }

  private process(pageResult: PageResult<Inquiry>): GetInquiriesResponseDto {
    return {
      ...pageResult,
      items: pageResult.items.map((inquiry) => new InquiryItemDto(inquiry)),
    };
  }
}
