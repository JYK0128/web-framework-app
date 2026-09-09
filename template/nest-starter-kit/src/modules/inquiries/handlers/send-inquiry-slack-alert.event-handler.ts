import { RequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { EventsHandler, type IEventHandler } from '@nestjs/cqrs';

import { SystemContext } from '#/common/contexts/system.context';
import { env } from '#/env';
import { AlertService } from '#/infra/alert';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { KvStore, KvStoreKey } from '#/infra/kv-store';
import { TemplateRendererService } from '#/infra/notification';
import { InquiryUnansweredDetectedEvent } from '#/modules/inquiries/events';

@Injectable()
@EventsHandler(InquiryUnansweredDetectedEvent)
export class SendInquirySlackAlertEventHandler implements IEventHandler<InquiryUnansweredDetectedEvent> {
  constructor(
    private readonly alertService: AlertService,
    private readonly em: AppEntityManager,
    private readonly kvStore: KvStore,
    private readonly templateRenderer: TemplateRendererService,
    private readonly systemContext: SystemContext,
  ) {}

  async handle(event: InquiryUnansweredDetectedEvent): Promise<void> {
    const identified = this.identify(event);
    this.verify(identified);
    await RequestContext.create(this.em, () => this.process(identified));
  }

  private identify(event: InquiryUnansweredDetectedEvent): InquiryUnansweredDetectedEvent {
    return event;
  }

  private verify(event: InquiryUnansweredDetectedEvent): void {
    if (!event.inquiry || !event.lastMessage || !Number.isFinite(event.elapsedMinutes)) {
      throw new Error('미응답 문의 이벤트를 확인할 수 없습니다.');
    }
  }

  private async process(event: InquiryUnansweredDetectedEvent): Promise<void> {
    const { inquiry, lastMessage, elapsedMinutes } = event;
    const directLink = `${env.FRONTEND_URL}/inquiry-management?inquiryId=${inquiry.id}`;
    const webhookUrl = await this.systemContext.getSlackWebhookUrl();
    const receivedTime = new Date(lastMessage.createdAt).toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const rendered = await this.templateRenderer.render(
      'SLACK_INQUIRY_UNANSWERED',
      {
        title: inquiry.title,
        content: lastMessage.content,
        category: inquiry.category,
        assignee: inquiry.assigneeName || '미지정',
        elapsedMinutes,
        linkUrl: directLink,
        inquiryId: inquiry.id,
      },
    );
    if (!rendered?.title) return;

    const result = await this.alertService.send({
      webhookUrl,
      level: 'warn',
      title: rendered.title,

      sections: [
        { label: '문의 제목', value: inquiry.title },
        { label: '문의 내용', value: lastMessage.content },
      ],
      fields: [
        { label: '카테고리', value: inquiry.category },
        { label: '담당자', value: inquiry.assigneeName || '미지정' },
        { label: '접수 시간', value: receivedTime },
        { label: '미응답 시간', value: `${elapsedMinutes}분 경과` },
      ],
      action: {
        text: '👉 문의 확인 및 답변하러 가기',
        url: directLink,
      },
      footer: rendered.body,
    });

    if (result.success) {
      return;
    }

    await this.kvStore.del(KvStoreKey.inquiry.unansweredAlertCooldown(inquiry.id));
    throw new Error(`Failed to send unanswered inquiry alert: ${inquiry.id}`);
  }
}
