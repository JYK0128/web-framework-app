import { HttpStatus, Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { AppEntityManager } from '#/database/entity-manager';
import { Inquiry } from '#/entities/inquiries/inquiry.entity';
import { InquiryItemDto } from '#/modules/inquiries/dto';
import { GetInquiryQuery } from '#/modules/inquiries/queries';

@Injectable()
@QueryHandler(GetInquiryQuery)
export class GetInquiryHandler implements IQueryHandler<GetInquiryQuery, InquiryItemDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetInquiryQuery): Promise<InquiryItemDto> {
    const inquiry = await this.identify(query.id, query.userId);
    return new InquiryItemDto(inquiry);
  }

  private async identify(id: string, userId: string): Promise<Inquiry> {
    const inquiry = await this.em.findOne(
      Inquiry,
      { id, user: userId },
      { populate: ['user'] },
    );
    if (!inquiry) {
      throw new ApplicationError({ code: 'INQUIRY_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return inquiry;
  }
}
