import { RequestContext } from '@mikro-orm/core';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { AppEntityManager } from '#/core/database/entity-manager';
import { DatabaseSeeder } from '#/core/database/seeders/database.seeder';
import { env } from '#/env';

@Injectable()
export class ResetDemoDataScheduler {
  private readonly logger = new Logger(ResetDemoDataScheduler.name);

  constructor(private readonly em: AppEntityManager) {}

  @Cron('0 * * * *', { waitForCompletion: true })
  async handleResetDemoData(): Promise<void> {
    if (env.NODE_ENV !== 'production' || !env.DEMO_ENABLED) return;

    const startedAt = Date.now();
    this.logger.log('Hourly demo data reset started.');

    try {
      await RequestContext.create(this.em, async () => {
        const schemaGenerator = this.em.getPlatform().getSchemaGenerator(this.em.getDriver(), this.em);
        await schemaGenerator.clear();
        await new DatabaseSeeder().run(this.em);
      });
      this.logger.log(`Hourly demo data reset completed in ${Date.now() - startedAt}ms.`);
    }
    catch (error) {
      this.logger.error(
        `Hourly demo data reset failed after ${Date.now() - startedAt}ms: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
