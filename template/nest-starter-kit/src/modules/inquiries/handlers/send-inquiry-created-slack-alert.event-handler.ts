import { RequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { EventsHandler, type IEventHandler } from '@nestjs/cqrs';

import { SystemContext } from '#/common/contexts/system.context';
import { env } from '#/env';
import { AlertService } from '#/infra/alert';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { TemplateRendererService } from '#/infra/notification';
import { InquiryCreatedEvent } from '#/modules/inquiries/events';

@Injectable()
@EventsHandler(InquiryCreatedEvent)
export class SendInquiryCreatedSlackAlertEventHandler implements IEventHandler<InquiryCreatedEvent> {
  constructor(
    private readonly alertService: AlertService,
    private readonly em: AppEntityManager,
    private readonly templateRenderer: TemplateRendererService,
    private readonly systemContext: SystemContext,
  ) {}

  async handle(event: InquiryCreatedEvent): Promise<void> {
    const identified = this.identify(event);
    this.verify(identified);
    await RequestContext.create(this.em, () => this.process(identified));
  }

  private identify(event: InquiryCreatedEvent): InquiryCreatedEvent {
    return event;
  }

  private verify(event: InquiryCreatedEvent): void {
    if (!event.inquiry || !event.author) {
      throw new Error('문의 생성 이벤트를 확인할 수 없습니다.');
    }
  }

  private async process(event: InquiryCreatedEvent): Promise<void> {
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
    );
    if (!rendered?.title) return;

    await this.alertService.send({
      webhookUrl,
      level: 'info',
      title: rendered.title,

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
  }
}
