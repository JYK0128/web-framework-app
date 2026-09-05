import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, type IEventHandler } from '@nestjs/cqrs';

import { SystemContext } from '#/common/contexts/system.context';
import { env } from '#/env';
import { AlertService } from '#/infra/alert';
import { KvStore, KvStoreKey } from '#/infra/kv-store';
import { TemplateRendererService } from '#/infra/notification';
import { InquiryUnansweredDetectedEvent } from '#/modules/inquiries/events';

@Injectable()
@EventsHandler(InquiryUnansweredDetectedEvent)
export class SendInquirySlackAlertEventHandler implements IEventHandler<InquiryUnansweredDetectedEvent> {
  private readonly logger = new Logger(SendInquirySlackAlertEventHandler.name);

  constructor(
    private readonly alertService: AlertService,
    private readonly kvStore: KvStore,
    private readonly templateRenderer: TemplateRendererService,
    private readonly systemContext: SystemContext,
  ) {}

  async handle(event: InquiryUnansweredDetectedEvent): Promise<void> {
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
      {
        fallback: {
          title: '미응답 문의 알림',
          body: `사용자의 마지막 메시지 이후 ${elapsedMinutes}분이 경과했습니다. 빠른 답변을 부탁드립니다.`,
        },
      },
    );

    const result = await this.alertService.send({
      webhookUrl: webhookUrl || undefined,
      level: 'warn',
      title: rendered.title || '미응답 문의 알림',

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
      this.logger.log(
        `[Slack Alert Sent] Inquiry: [${inquiry.id}] "${inquiry.title}" (${elapsedMinutes} mins elapsed)`,
      );
      return;
    }

    await this.kvStore.del(KvStoreKey.inquiry.unansweredAlertCooldown(inquiry.id));
    throw new Error(`Failed to send unanswered inquiry alert: ${inquiry.id}`);
  }
}
