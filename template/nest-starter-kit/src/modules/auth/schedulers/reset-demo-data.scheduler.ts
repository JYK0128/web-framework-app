import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

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
  @Cron(CronExpression.EVERY_HOUR)
  async handleResetDemoData(): Promise<void> {
    this.logger.log('Starting demo data reset via schema.clear()...');

    try {
      // 1. MikroORM SchemaGenerator: FK 비활성화, 역순 TRUNCATE, Identity Map 초기화
      const schemaGenerator = this.em.getPlatform().getSchemaGenerator(this.em.getDriver(), this.em);
      await schemaGenerator.clear();

      // 2. Run DatabaseSeeder
      const seeder = new DatabaseSeeder();
      await seeder.run(this.em);

      this.logger.log('Demo data reset completed successfully via schema.clear().');
    }
    catch (error) {
      this.logger.error(
        `Demo data reset failed: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
