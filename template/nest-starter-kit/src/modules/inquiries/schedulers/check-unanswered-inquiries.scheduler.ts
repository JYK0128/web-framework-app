import { QueryOrder, RequestContext } from '@mikro-orm/core';
import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Cron } from '@nestjs/schedule';

import { INQUIRY_ALERT_COOLDOWN_MINUTES, INQUIRY_ALERT_CRON } from '#/common/configs/inquiry.config';
import { SystemContext } from '#/common/contexts/system.context';
import { Inquiry, InquiryStatus } from '#/entities/inquiries/inquiry.entity';
import { InquiryMessage, InquiryMessageAuthorRole } from '#/entities/inquiries/inquiry-message.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { EventBroker } from '#/infra/event-broker';
import { KvStore, KvStoreKey } from '#/infra/kv-store';
import { InquiryUnansweredDetectedEvent } from '#/modules/inquiries/events';
import type { GetSystemConfigResponseDto } from '#/modules/system-config/dto';
import { GetSystemConfigQuery } from '#/modules/system-config/queries/get-system-config.query';

@Injectable()
export class CheckUnansweredInquiriesScheduler {
  private readonly logger = new Logger(CheckUnansweredInquiriesScheduler.name);

  constructor(
    private readonly em: AppEntityManager,
    private readonly kvStore: KvStore,
    private readonly eventBroker: EventBroker,
    private readonly queryBus: QueryBus,
    private readonly systemContext: SystemContext,
  ) {}

  /**
   * 5분마다 점검: 시스템 운영시간 중 PENDING/ANSWERED 상태 문의에 대해
   * 마지막 메시지가 사용자 발신이고 설정된 기준 시간(분) 이상 경과한 경우 10분 간격으로 미응답 감지 이벤트 발행.
   */
  @Cron(INQUIRY_ALERT_CRON)
  async handleCheckUnansweredInquiries(): Promise<void> {
    try {
      await RequestContext.create(this.em, async () => {
        const webhookUrl = await this.systemContext.getSlackWebhookUrl();
        if (!webhookUrl) return;

        const config = await this.queryBus.execute<GetSystemConfigQuery, GetSystemConfigResponseDto>(
          new GetSystemConfigQuery(),
        );
        if (!config.operatingStatus.isOpen) return;

        const inquiryPolicy = await this.systemContext.getInquiryPolicy();
        const thresholdMinutes = inquiryPolicy.unansweredThresholdMinutes || 10;
        const threshold = new Date(
          Date.now() - thresholdMinutes * 60_000,
        );

        const activeInquiries = await this.em.find(
          Inquiry,
          { status: { $in: [InquiryStatus.PENDING, InquiryStatus.ANSWERED] } },
          { filters: false, populate: ['assignee'] },
        );

        if (activeInquiries.length === 0) return;

        for (const inquiry of activeInquiries) {
          await this.inspectInquiry(inquiry, threshold);
        }
      });
    }

    catch (err) {
      this.logger.error(
        `미응답 문의 점검 중 오류 발생: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private async inspectInquiry(
    inquiry: Inquiry,
    threshold: Date,
  ): Promise<void> {
    const lastMessage = await this.em.findOne(
      InquiryMessage,
      { inquiry: { id: inquiry.id } },
      { orderBy: { createdAt: QueryOrder.DESC } },
    );

    if (!lastMessage) return;
    if (lastMessage.authorRole !== InquiryMessageAuthorRole.USER) return;
    if (lastMessage.createdAt >= threshold) return;

    // 쿨다운 확인
    const cooldownKey = KvStoreKey.inquiry.unansweredAlertCooldown(inquiry.id);
    const acquired = await this.kvStore.setIfAbsent(
      cooldownKey,
      '1',
      INQUIRY_ALERT_COOLDOWN_MINUTES * 60,
    );
    if (!acquired) return;

    const elapsedMinutes = Math.floor((Date.now() - lastMessage.createdAt.getTime()) / 60_000);

    // 이벤트 발행 (Scheduler -> EventBroker -> EventBus / External Brokers)
    await this.eventBroker.publish(
      new InquiryUnansweredDetectedEvent(
        {
          id: inquiry.id,
          title: inquiry.title,
          category: inquiry.category,
          assigneeName: inquiry.assignee?.name || inquiry.assignee?.email || null,
        },
        {
          content: lastMessage.content,
          createdAt: lastMessage.createdAt,
        },
        elapsedMinutes,
      ),
    );
  }
}
