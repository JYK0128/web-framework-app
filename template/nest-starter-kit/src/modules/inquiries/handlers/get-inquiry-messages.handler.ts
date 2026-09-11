import { HttpStatus, Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError, valueIf } from '@pkg/shared/common';

import { SessionContext } from '#/common/contexts/session.context';
import { Inquiry } from '#/entities/inquiries/inquiry.entity';
import { InquiryMessage } from '#/entities/inquiries/inquiry-message.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { GetInquiryMessagesResponseDto } from '#/modules/inquiries/dto';
import { GetInquiryMessagesQuery } from '#/modules/inquiries/queries';

@Injectable()
@QueryHandler(GetInquiryMessagesQuery)
export class GetInquiryMessagesHandler implements IQueryHandler<GetInquiryMessagesQuery, GetInquiryMessagesResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly sessionContext: SessionContext,
  ) {}

  async execute(query: GetInquiryMessagesQuery): Promise<GetInquiryMessagesResponseDto> {
    const inquiry = await this.identifyInquiry(query.input);
    const messages = await this.identifyMessages(inquiry.id);
    this.verify(inquiry, messages);
    return this.process(messages);
  }

  private verify(inquiry: Inquiry, messages: InquiryMessage[]): void {
    if (!inquiry || !Array.isArray(messages)) {
      throw new Error('문의 메시지를 확인할 수 없습니다.');
    }
  }

  private async identifyMessages(inquiryId: string): Promise<InquiryMessage[]> {
    return this.em.find(
      InquiryMessage,
      { inquiry: inquiryId },
      { orderBy: { createdAt: 'ASC' }, populate: ['inquiry', 'author'] },
    );
  }

  private process(messages: InquiryMessage[]): GetInquiryMessagesResponseDto {
    return GetInquiryMessagesResponseDto.fromPlain({ items: messages });
  }

  private async identifyInquiry(input: GetInquiryMessagesQuery['input']): Promise<Inquiry> {
    const inquiry = await this.em.findOne(
      Inquiry,
      input.isAdmin
        ? { id: input.inquiryId }
        : { id: input.inquiryId, user: input.userId ?? this.sessionContext.requiredUser.id },
      { filters: valueIf(!input.isAdmin, false), populate: ['user'] },
    );
    if (!inquiry || inquiry.deletedAt) {
      throw new ApplicationError({ code: 'INQUIRY_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return inquiry;
  }
}
