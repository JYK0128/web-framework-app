import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

import { SuperAdminSeeder } from './super-admin.seeder';

export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    await this.call(em, [SuperAdminSeeder]);
  }
}
