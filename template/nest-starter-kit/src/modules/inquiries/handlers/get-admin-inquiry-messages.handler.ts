import { HttpStatus, Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Inquiry } from '#/entities/inquiries/inquiry.entity';
import { InquiryMessage } from '#/entities/inquiries/inquiry-message.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { GetAdminInquiryMessagesResponseDto } from '#/modules/inquiries/dto';
import { GetAdminInquiryMessagesQuery } from '#/modules/inquiries/queries';

@Injectable()
@QueryHandler(GetAdminInquiryMessagesQuery)
export class GetAdminInquiryMessagesHandler implements IQueryHandler<GetAdminInquiryMessagesQuery, GetAdminInquiryMessagesResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetAdminInquiryMessagesQuery): Promise<GetAdminInquiryMessagesResponseDto> {
    const inquiry = await this.identifyInquiry(query.input.inquiryId);
    const messages = await this.identifyMessages(inquiry.id);
    this.verify(inquiry, messages);
    return GetAdminInquiryMessagesResponseDto.fromPlain({ items: messages });
  }

  private async identifyInquiry(id: string): Promise<Inquiry> {
    const inquiry = await this.em.findOne(Inquiry, { id }, { populate: ['user'] });
    if (!inquiry || inquiry.deletedAt) {
      throw new ApplicationError({ code: 'INQUIRY_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return inquiry;
  }

  private async identifyMessages(inquiryId: string): Promise<InquiryMessage[]> {
    return this.em.find(
      InquiryMessage,
      { inquiry: inquiryId },
      { orderBy: { createdAt: 'ASC' }, populate: ['inquiry', 'author'] },
    );
  }

  private verify(inquiry: Inquiry, messages: InquiryMessage[]): void {
    if (!inquiry || !Array.isArray(messages)) {
      throw new Error('문의 메시지를 확인할 수 없습니다.');
    }
  }
}
