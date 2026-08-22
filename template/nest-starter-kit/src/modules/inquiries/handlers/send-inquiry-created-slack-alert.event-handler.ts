import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, type IEventHandler } from '@nestjs/cqrs';

import { env } from '#/env';
import { MessengerChannel } from '#/infra/notification';
import { InquiryCreatedEvent } from '#/modules/inquiries/events';

@Injectable()
@EventsHandler(InquiryCreatedEvent)
export class SendInquiryCreatedSlackAlertEventHandler implements IEventHandler<InquiryCreatedEvent> {
  private readonly logger = new Logger(SendInquiryCreatedSlackAlertEventHandler.name);

  constructor(private readonly messenger: MessengerChannel) {}

  async handle(event: InquiryCreatedEvent): Promise<void> {
    const { inquiry, author } = event;
    const directLink = `${env.FRONTEND_URL}/inquiry-management?inquiryId=${inquiry.id}`;

    const sent = await this.messenger.sendNotification({
      level: 'info',
      title: '새 1:1 문의 접수',
      sections: [
        { label: '문의 제목', value: inquiry.title },
        { label: '문의 내용', value: inquiry.content },
      ],
      fields: [
        { label: '카테고리', value: inquiry.category },
        { label: '작성자', value: author.name || author.email || '알 수 없음' },
      ],
      action: {
        text: '👉 문의 확인 및 답변하러 가기',
        url: directLink,
      },
      footer: '새로운 1:1 문의가 등록되었습니다.',
    });

    if (sent) {
      this.logger.log(`[Slack Sent] New Inquiry: [${inquiry.id}] "${inquiry.title}"`);
    }
  }
}
