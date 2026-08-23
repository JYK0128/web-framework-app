import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, type IEventHandler } from '@nestjs/cqrs';

import { SLACK_ALERT_TEMPLATES } from '#/common/constants/alert.constants';
import { env } from '#/env';
import { MessengerChannel } from '#/infra/notification';
import { RedisKey, RedisService } from '#/infra/redis';
import { InquiryUnansweredDetectedEvent } from '#/modules/inquiries/events';

@Injectable()
@EventsHandler(InquiryUnansweredDetectedEvent)
export class SendInquirySlackAlertEventHandler implements IEventHandler<InquiryUnansweredDetectedEvent> {
  private readonly logger = new Logger(SendInquirySlackAlertEventHandler.name);

  constructor(
    private readonly messenger: MessengerChannel,
    private readonly redis: RedisService,
  ) {}

  async handle(event: InquiryUnansweredDetectedEvent): Promise<void> {
    const { inquiry, lastMessage, elapsedMinutes } = event;
    const directLink = `${env.FRONTEND_URL}/inquiry-management?inquiryId=${inquiry.id}`;
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

    const template = SLACK_ALERT_TEMPLATES.INQUIRY_UNANSWERED;

    const sent = await this.messenger.sendNotification({
      level: 'warn',
      title: template.TITLE,
      sections: [
        { label: template.LABELS.TITLE, value: inquiry.title },
        { label: template.LABELS.CONTENT, value: lastMessage.content },
      ],
      fields: [
        { label: template.LABELS.CATEGORY, value: inquiry.category },
        { label: template.LABELS.ASSIGNEE, value: inquiry.assigneeName || template.LABELS.UNASSIGNED },
        { label: template.LABELS.RECEIVED_TIME, value: receivedTime },
        { label: template.LABELS.ELAPSED_TIME, value: `${elapsedMinutes}분 경과` },
      ],
      action: {
        text: template.ACTION_TEXT,
        url: directLink,
      },
      footer: template.FOOTER(elapsedMinutes),
    });

    if (sent) {
      this.logger.log(
        `[Slack Alert Sent] Inquiry: [${inquiry.id}] "${inquiry.title}" (${elapsedMinutes} mins elapsed)`,
      );
      return;
    }

    await this.redis.del(RedisKey.inquiry.unansweredAlertCooldown(inquiry.id));
    throw new Error(`Failed to send unanswered inquiry alert: ${inquiry.id}`);
  }
}
