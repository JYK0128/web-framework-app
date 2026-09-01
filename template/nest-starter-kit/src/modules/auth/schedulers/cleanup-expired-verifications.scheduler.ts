import { RequestContext } from '@mikro-orm/core';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { Verification } from '#/entities/auth/verification.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';

@Injectable()
export class CleanupExpiredVerificationsScheduler {
  private readonly logger = new Logger(CleanupExpiredVerificationsScheduler.name);

  constructor(private readonly em: AppEntityManager) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleCleanupExpiredVerifications(): Promise<void> {
    try {
      await RequestContext.create(this.em, async () => {
        const deleted = await this.em.nativeDelete(Verification, {
          expiresAt: { $lte: new Date() },
        });
        if (deleted > 0) {
          this.logger.log(`만료된 본인인증 토큰 ${deleted}건을 정리했습니다.`);
        }
      });
    }
    catch (error) {
      this.logger.error(
        `만료 본인인증 토큰 정리 실패: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
