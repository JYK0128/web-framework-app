import { RequestContext } from '@mikro-orm/core';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { Session } from '#/entities/auth/session.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';

@Injectable()
export class CleanupExpiredSessionsScheduler {
  private static readonly CLEANUP_BATCH_SIZE = 1000;
  private readonly logger = new Logger(CleanupExpiredSessionsScheduler.name);

  constructor(private readonly em: AppEntityManager) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCleanupExpiredSessions(): Promise<void> {
    const startedAt = Date.now();
    this.logger.log('만료 세션 정리 작업을 시작합니다.');
    try {
      let deletedCount = 0;
      await RequestContext.create(this.em, async () => {
        const expiredSessions = await this.em.find(
          Session,
          { expiresAt: { $lte: new Date() } },
          { fields: ['id'], limit: CleanupExpiredSessionsScheduler.CLEANUP_BATCH_SIZE },
        );

        if (expiredSessions.length > 0) {
          const ids = expiredSessions.map(({ id }) => id);
          deletedCount = ids.length;
          await this.em.nativeDelete(Session, { id: { $in: ids } });
        }
      });
      const durationMs = Date.now() - startedAt;
      this.logger.log(`만료 세션 정리 성공 (정리: ${deletedCount}건, 소요시간: ${durationMs}ms)`);
    }
    catch (error) {
      const durationMs = Date.now() - startedAt;
      this.logger.error(
        `만료 세션 정리 실패 (${durationMs}ms): ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
