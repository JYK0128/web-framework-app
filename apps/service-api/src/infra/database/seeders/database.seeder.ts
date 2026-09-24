import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

import { FaqSeeder } from './faq.seeder';
import { ServiceTermsSeeder } from './service-terms.seeder';
import { UserSeeder } from './user.seeder';

export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    await this.call(em, [UserSeeder, FaqSeeder, ServiceTermsSeeder]);
  }
}
