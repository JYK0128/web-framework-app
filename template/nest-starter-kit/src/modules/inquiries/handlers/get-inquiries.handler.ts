import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Inquiry } from '#/entities/inquiries/inquiry.entity';
import { AppEntityManager, type PageResult } from '#/infra/database/entity-manager';
import { GetInquiriesResponseDto, InquiryItemDto } from '#/modules/inquiries/dto';
import { GetInquiriesQuery } from '#/modules/inquiries/queries';

@Injectable()
@QueryHandler(GetInquiriesQuery)
export class GetInquiriesHandler implements IQueryHandler<GetInquiriesQuery, GetInquiriesResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetInquiriesQuery): Promise<GetInquiriesResponseDto> {
    const pageResult = await this.identifyInquiries(query);
    return this.process(pageResult);
  }

  private async identifyInquiries(query: GetInquiriesQuery): Promise<PageResult<Inquiry>> {
    return this.em.findByPage(
      Inquiry,
      { $and: [{ user: query.userId }, query.query.toFilterQuery()] },
      {
        ...query.query.toPageOptions(),
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
