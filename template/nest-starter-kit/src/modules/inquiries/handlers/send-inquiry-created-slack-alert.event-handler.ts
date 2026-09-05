import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, type IEventHandler } from '@nestjs/cqrs';

import { SystemContext } from '#/common/contexts/system.context';
import { env } from '#/env';
import { AlertService } from '#/infra/alert';
import { TemplateRendererService } from '#/infra/notification';
import { InquiryCreatedEvent } from '#/modules/inquiries/events';

@Injectable()
@EventsHandler(InquiryCreatedEvent)
export class SendInquiryCreatedSlackAlertEventHandler implements IEventHandler<InquiryCreatedEvent> {
  private readonly logger = new Logger(SendInquiryCreatedSlackAlertEventHandler.name);

  constructor(
    private readonly alertService: AlertService,
    private readonly templateRenderer: TemplateRendererService,
    private readonly systemContext: SystemContext,
  ) {}

  async handle(event: InquiryCreatedEvent): Promise<void> {
    const { inquiry, author } = event;
    const directLink = `${env.FRONTEND_URL}/inquiry-management?inquiryId=${inquiry.id}`;
    const authorName = author.name || author.email || '알 수 없음';
    const webhookUrl = await this.systemContext.getSlackWebhookUrl();

    const rendered = await this.templateRenderer.render(
      'SLACK_INQUIRY_CREATED',
      {
        title: inquiry.title,
        content: inquiry.content,
        category: inquiry.category,
        author: authorName,
        linkUrl: directLink,
        inquiryId: inquiry.id,
      },
      {
        fallback: {
          title: '새 1:1 문의 접수',
          body: '새로운 1:1 문의가 등록되었습니다.',
        },
      },
    );

    const result = await this.alertService.send({
      webhookUrl: webhookUrl || undefined,
      level: 'info',
      title: rendered.title || '새 1:1 문의 접수',

      sections: [
        { label: '문의 제목', value: inquiry.title },
        { label: '문의 내용', value: inquiry.content },
      ],
      fields: [
        { label: '카테고리', value: inquiry.category },
        { label: '작성자', value: authorName },
      ],
      action: {
        text: '👉 문의 확인 및 답변하러 가기',
        url: directLink,
      },
      footer: rendered.body,
    });

    if (result.success) {
      this.logger.log(`[Slack Sent] New Inquiry: [${inquiry.id}] "${inquiry.title}"`);
    }
  }
}
