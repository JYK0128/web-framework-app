import { QueryOrder, RequestContext } from '@mikro-orm/core';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { Inquiry, InquiryStatus } from '#/entities/inquiries/inquiry.entity';
import { InquiryMessage, InquiryMessageAuthorRole } from '#/entities/inquiries/inquiry-message.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { InquiryMessagesGateway } from '#/modules/inquiries/inquiry-messages.gateway';
import { SystemConfigService } from '#/modules/system-config/system-config.service';

@Injectable()
export class AutoCloseInquiriesScheduler {
  private readonly logger = new Logger(AutoCloseInquiriesScheduler.name);

  constructor(
    private readonly em: AppEntityManager,
    private readonly gateway: InquiryMessagesGateway,
    private readonly systemConfigService: SystemConfigService,
  ) {}

  /**
   * 매 10분마다 실행: ANSWERED(답변 중) 상태이고 마지막 메시지가 관리자 발신이며,
   * 설정된 autoCloseHours 시간 동안 사용자 추가 응답이 없는 경우 CLOSED(문의 종료)로 자동 전환.
   */
  @Cron('*/10 * * * *')
  async handleAutoCloseInquiries(): Promise<void> {
    try {
      await RequestContext.create(this.em, async () => {
        const inquiryPolicy = await this.systemConfigService.getInquiryPolicy();
        const autoCloseHours = inquiryPolicy.autoCloseHours || 72;
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
            await this.gateway.broadcastStatusChange(inquiry.id, InquiryStatus.CLOSED);
            this.logger.log(
              `[Auto Closed] Inquiry: [${inquiry.id}] "${inquiry.title}" (no user response for ${autoCloseHours}h)`,
            );
          }
        }

        await this.em.flush();
      });
    }

    catch (err) {
      this.logger.error(
        `자동 문의 종료 처리 중 오류 발생: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
