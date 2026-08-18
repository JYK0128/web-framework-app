import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AppEntityManager, type PageResult } from '#/database/entity-manager';
import { Inquiry } from '#/entities/inquiries/inquiry.entity';
import { GetInquiriesResponseDto, InquiryItemDto } from '#/modules/inquiries/dto';
import { GetInquiriesQuery } from '#/modules/inquiries/queries';

@Injectable()
@QueryHandler(GetInquiriesQuery)
export class GetInquiriesHandler implements IQueryHandler<GetInquiriesQuery, GetInquiriesResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetInquiriesQuery): Promise<GetInquiriesResponseDto> {
    const pageResult = await this.identify(query);
    return this.process(pageResult);
  }

  private async identify(query: GetInquiriesQuery): Promise<PageResult<Inquiry>> {
    return this.em.findByPage(
      Inquiry,
      { $and: [{ user: query.userId }, query.query.toFilterQuery()] },
      {
        ...query.query.toPageOptions(),
        populate: ['user'],
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
