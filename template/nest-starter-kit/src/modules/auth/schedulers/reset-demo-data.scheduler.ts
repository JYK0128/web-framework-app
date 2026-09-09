import { RequestContext } from '@mikro-orm/core';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { when } from '@pkg/shared/common';

import { RESET_DEMO_DATA_CRON } from '#/common/configs/communication.config';
import { env } from '#/env';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { DatabaseSeeder } from '#/infra/database/seeders/database.seeder';

@Injectable()
export class ResetDemoDataScheduler {
  private readonly logger = new Logger(ResetDemoDataScheduler.name);

  constructor(private readonly em: AppEntityManager) {}

  /**
   * Runs every hour at minute 0 (e.g. 01:00, 02:00, 03:00...).
   * Uses MikroORM SchemaGenerator.clear() to truncate all entity tables and runs DatabaseSeeder.
   */
  @Cron(RESET_DEMO_DATA_CRON)
  async handleResetDemoData(): Promise<void> {
    if (env.NODE_ENV === 'development') {
      return;
    }
    const startedAt = Date.now();
    this.logger.log('데모 데이터 초기화 작업을 시작합니다.');
    try {
      await RequestContext.create(this.em, async () => {
        // 1. MikroORM SchemaGenerator: FK 비활성화, 역순 TRUNCATE, Identity Map 초기화
        const schemaGenerator = this.em.getPlatform().getSchemaGenerator(this.em.getDriver(), this.em);
        await schemaGenerator.clear();

        // 2. Run DatabaseSeeder
        const seeder = new DatabaseSeeder();
        await seeder.run(this.em);
      });
      const durationMs = Date.now() - startedAt;
      this.logger.log(`데모 데이터 초기화 성공 (소요시간: ${durationMs}ms)`);
    }
    catch (error) {
      const durationMs = Date.now() - startedAt;
      this.logger.error(
        `데모 데이터 초기화 실패 (${durationMs}ms): ${error instanceof Error ? error.message : String(error)}`,
        when((value): value is Error => value instanceof Error, (error) => error.stack)(error),
      );
    }
  }
}
