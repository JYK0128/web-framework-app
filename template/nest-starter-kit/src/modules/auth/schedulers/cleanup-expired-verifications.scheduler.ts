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
    const startedAt = Date.now();
    this.logger.log('만료 본인인증 토큰 정리 작업을 시작합니다.');
    try {
      let deletedCount = 0;
      await RequestContext.create(this.em, async () => {
        deletedCount = await this.em.nativeDelete(Verification, {
          expiresAt: { $lte: new Date() },
        });
      });
      const durationMs = Date.now() - startedAt;
      this.logger.log(`만료 본인인증 토큰 정리 성공 (정리: ${deletedCount}건, 소요시간: ${durationMs}ms)`);
    }
    catch (error) {
      const durationMs = Date.now() - startedAt;
      this.logger.error(
        `만료 본인인증 토큰 정리 실패 (${durationMs}ms): ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
