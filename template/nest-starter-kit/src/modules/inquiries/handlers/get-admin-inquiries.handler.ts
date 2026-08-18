import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AppEntityManager, type PageResult } from '#/database/entity-manager';
import { Inquiry } from '#/entities/inquiries/inquiry.entity';
import { GetAdminInquiriesRequestDto, GetInquiriesResponseDto, InquiryItemDto } from '#/modules/inquiries/dto';
import { GetAdminInquiriesQuery } from '#/modules/inquiries/queries';

@Injectable()
@QueryHandler(GetAdminInquiriesQuery)
export class GetAdminInquiriesHandler implements IQueryHandler<GetAdminInquiriesQuery, GetInquiriesResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetAdminInquiriesQuery): Promise<GetInquiriesResponseDto> {
    const pageResult = await this.identify(query.query);
    return {
      ...pageResult,
      items: pageResult.items.map((inquiry) => new InquiryItemDto(inquiry)),
    };
  }

  private async identify(query: GetAdminInquiriesRequestDto): Promise<PageResult<Inquiry>> {
    return this.em.findByPage(Inquiry, query.toFilterQuery(), {
      ...query.toPageOptions(),
      populate: ['user', 'assignee'],
    });
  }
}
