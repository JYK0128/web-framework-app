import { QueryOrder } from '@mikro-orm/core';
import { Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { Cron } from '@nestjs/schedule';

import { RedisService } from '#/common/services/redis/redis.service';
import { AppEntityManager } from '#/database/entity-manager';
import { Inquiry, InquiryStatus } from '#/entities/inquiries/inquiry.entity';
import { InquiryMessage, InquiryMessageAuthorRole } from '#/entities/inquiries/inquiry-message.entity';
import { env } from '#/env';
import { ALERT_COOLDOWN_MINUTES, ALERT_CRON, ALERT_THRESHOLD_MINUTES, AUTO_CLOSE_HOURS, isOperatingHours } from '#/modules/inquiries/constants/inquiry-policy.constants';
import { InquiryUnansweredDetectedEvent } from '#/modules/inquiries/events';
import { InquiryMessagesGateway } from '#/modules/inquiries/inquiry-messages.gateway';

@Injectable()
export class InquiryScheduler {
  private readonly logger = new Logger(InquiryScheduler.name);

  constructor(
    private readonly em: AppEntityManager,
    private readonly redis: RedisService,
    private readonly eventBus: EventBus,
    private readonly gateway: InquiryMessagesGateway,
  ) {}

  /**
   * 매 10분마다 실행: ANSWERED(답변 중) 상태이고 마지막 메시지가 관리자 발신이며,
   * 72시간 동안 사용자 추가 응답이 없는 경우 CLOSED(문의 종료)로 자동 전환.
   */
  @Cron('*/10 * * * *')
  async autoCloseInquiries(): Promise<void> {
    const threshold = new Date(Date.now() - AUTO_CLOSE_HOURS * 60 * 60 * 1000);
    const em = this.em.fork();

    try {
      const answeredInquiries = await em.find(
        Inquiry,
        { status: InquiryStatus.ANSWERED },
        { filters: false },
      );

      if (answeredInquiries.length === 0) return;

      for (const inquiry of answeredInquiries) {
        const lastMessage = await em.findOne(
          InquiryMessage,
          { inquiry: { id: inquiry.id } },
          { orderBy: { createdAt: QueryOrder.DESC } },
        );

        if (
          lastMessage
          && lastMessage.authorRole === InquiryMessageAuthorRole.ADMIN
          && lastMessage.createdAt <= threshold
        ) {
          inquiry.status = InquiryStatus.CLOSED;
          em.persist(inquiry);
          await this.gateway.broadcastStatusChange(inquiry.id, InquiryStatus.CLOSED);
          this.logger.log(
            `[Auto Closed] Inquiry: [${inquiry.id}] "${inquiry.title}" (no user response for ${AUTO_CLOSE_HOURS}h)`,
          );
        }
      }

      await em.flush();
    }
    catch (err) {
      this.logger.error(
        `자동 문의 종료 처리 중 오류 발생: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * 5분마다 점검: 서비스 운영 시간(평일 09~18시) 중 PENDING 상태 문의에 대해
   * 마지막 메시지가 사용자 발신이고 10분 이상 경과한 경우 10분 간격으로 미응답 감지 이벤트 발행.
   */
  @Cron(ALERT_CRON)
  async checkUnansweredInquiries(): Promise<void> {
    if (!env.SLACK_WEBHOOK_URL) return;
    if (!(await isOperatingHours())) return;

    const threshold = new Date(
      Date.now() - ALERT_THRESHOLD_MINUTES * 60_000,
    );

    const em = this.em.fork();

    try {
      const activeInquiries = await em.find(
        Inquiry,
        { status: { $in: [InquiryStatus.PENDING, InquiryStatus.ANSWERED] } },
        { filters: false, populate: ['assignee'] },
      );

      if (activeInquiries.length === 0) return;

      for (const inquiry of activeInquiries) {
        await this.inspectInquiry(em, inquiry, threshold);
      }
    }
    catch (err) {
      this.logger.error(
        `미응답 문의 점검 중 오류 발생: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private async inspectInquiry(
    em: AppEntityManager,
    inquiry: Inquiry,
    threshold: Date,
  ): Promise<void> {
    const lastMessage = await em.findOne(
      InquiryMessage,
      { inquiry: { id: inquiry.id } },
      { orderBy: { createdAt: QueryOrder.DESC } },
    );

    if (!lastMessage) return;
    if (lastMessage.authorRole !== InquiryMessageAuthorRole.USER) return;
    if (lastMessage.createdAt >= threshold) return;

    // 쿨다운 확인
    const redisKey = `inquiry:unanswered-alert:${inquiry.id}`;
    const alreadyAlerted = await this.redis.exists(redisKey);
    if (alreadyAlerted) return;

    // 쿨다운 등록 (선점)
    await this.redis.set(redisKey, '1', ALERT_COOLDOWN_MINUTES * 60);

    const elapsedMinutes = Math.floor((Date.now() - lastMessage.createdAt.getTime()) / 60_000);

    // 이벤트 발행 (Scheduler -> Event -> EventHandler)
    this.eventBus.publish(
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
