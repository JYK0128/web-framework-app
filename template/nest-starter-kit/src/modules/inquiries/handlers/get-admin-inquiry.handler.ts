import { HttpStatus, Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { AppEntityManager } from '#/database/entity-manager';
import { Inquiry } from '#/entities/inquiries/inquiry.entity';
import { InquiryItemDto } from '#/modules/inquiries/dto';
import { GetAdminInquiryQuery } from '#/modules/inquiries/queries';

@Injectable()
@QueryHandler(GetAdminInquiryQuery)
export class GetAdminInquiryHandler implements IQueryHandler<GetAdminInquiryQuery, InquiryItemDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetAdminInquiryQuery): Promise<InquiryItemDto> {
    const inquiry = await this.identify(query.id);
    return new InquiryItemDto(inquiry);
  }

  private async identify(id: string): Promise<Inquiry> {
    const inquiry = await this.em.findOne(
      Inquiry,
      { id },
      { filters: false, populate: ['user', 'assignee'] },
    );
    if (!inquiry || inquiry.deletedAt) {
      throw new ApplicationError({ code: 'INQUIRY_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return inquiry;
  }
}
