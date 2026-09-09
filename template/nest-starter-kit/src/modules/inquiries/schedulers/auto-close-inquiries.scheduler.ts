import { QueryOrder, RequestContext } from '@mikro-orm/core';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { AUTO_CLOSE_INQUIRY_CRON } from '#/common/configs/communication.config';
import { SystemContext } from '#/common/contexts/system.context';
import { Inquiry, InquiryStatus } from '#/entities/inquiries/inquiry.entity';
import { InquiryMessage, InquiryMessageAuthorRole } from '#/entities/inquiries/inquiry-message.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { InquiryMessagesGateway } from '#/modules/inquiries/inquiry-messages.gateway';

@Injectable()
export class AutoCloseInquiriesScheduler {
  private readonly logger = new Logger(AutoCloseInquiriesScheduler.name);

  constructor(
    private readonly em: AppEntityManager,
    private readonly gateway: InquiryMessagesGateway,
    private readonly systemContext: SystemContext,
  ) {}

  /**
   * 매 10분마다 실행: ANSWERED(답변 중) 상태이고 마지막 메시지가 관리자 발신이며,
   * 설정된 autoCloseHours 시간 동안 사용자 추가 응답이 없는 경우 CLOSED(문의 종료)로 자동 전환.
   */
  @Cron(AUTO_CLOSE_INQUIRY_CRON)
  async handleAutoCloseInquiries(): Promise<void> {
    const startedAt = Date.now();
    this.logger.log('문의 자동 종료 점검을 시작합니다.');
    try {
      let closedCount = 0;
      await RequestContext.create(this.em, async () => {
        const inquiryPolicy = await this.systemContext.getInquiryPolicy();
        const autoCloseHours = inquiryPolicy.autoCloseHours;
        const threshold = new Date(Date.now() - autoCloseHours * 60 * 60 * 1000);

        const answeredInquiries = await this.em.find(
          Inquiry,
          { status: InquiryStatus.ANSWERED },
          { filters: false },
        );

        if (answeredInquiries.length === 0) return;

        for (const inquiry of answeredInquiries) {
          const lastMessage = await this.em.findOne(
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
            this.em.persist(inquiry);
            closedCount += 1;
            await this.gateway.broadcastStatusChange(inquiry.id, InquiryStatus.CLOSED);
          }
        }

        if (closedCount > 0) {
          await this.em.flush();
        }
      });
      const durationMs = Date.now() - startedAt;
      this.logger.log(`문의 자동 종료 점검 성공 (종료 처리: ${closedCount}건, 소요시간: ${durationMs}ms)`);
    }
    catch (err) {
      const durationMs = Date.now() - startedAt;
      this.logger.error(
        `자동 문의 종료 처리 실패 (${durationMs}ms): ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
