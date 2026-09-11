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
    return GetAdminInquiriesResponseDto.fromPlain({
      ...pageResult,
      items: pageResult.items.map((inquiry) => InquiryItemDto.fromPlain({
        id: inquiry.id,
        userId: inquiry.user.id,
        userName: inquiry.user.name,
        assigneeId: inquiry.assignee?.id ?? null,
        assigneeName: inquiry.assignee?.name ?? null,
        category: inquiry.category,
        title: inquiry.title,
        content: inquiry.content,
        status: inquiry.status,
        createdAt: inquiry.createdAt,
        updatedAt: inquiry.updatedAt,
      })),
    });
  }
}
