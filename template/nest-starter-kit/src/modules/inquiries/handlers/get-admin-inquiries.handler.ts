import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Inquiry } from '#/entities/inquiries/inquiry.entity';
import { AppEntityManager, type PageResult } from '#/infra/database/entity-manager';
import { GetAdminInquiriesRequestDto, GetAdminInquiriesResponseDto, InquiryItemDto } from '#/modules/inquiries/dto';
import { GetAdminInquiriesQuery } from '#/modules/inquiries/queries';

@Injectable()
@QueryHandler(GetAdminInquiriesQuery)
export class GetAdminInquiriesHandler implements IQueryHandler<GetAdminInquiriesQuery, GetAdminInquiriesResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetAdminInquiriesQuery): Promise<GetAdminInquiriesResponseDto> {
    const pageResult = await this.identifyInquiries(query.input);
    this.verify(pageResult);
    return this.process(pageResult);
  }

  private verify(pageResult: PageResult<Inquiry>): void {
    if (!Array.isArray(pageResult.items)) {
      throw new Error('문의 목록을 확인할 수 없습니다.');
    }
  }

  private async identifyInquiries(query: GetAdminInquiriesRequestDto): Promise<PageResult<Inquiry>> {
    return this.em.findByPage(Inquiry, query.toFilterQuery(), {
      ...query.toPageOptions(),
      populate: ['user', 'assignee'],
    });
  }

  private process(pageResult: PageResult<Inquiry>): GetAdminInquiriesResponseDto {
    return {
      ...pageResult,
      items: pageResult.items.map((inquiry) => new InquiryItemDto(inquiry)),
    };
  }
}
