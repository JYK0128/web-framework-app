import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

import { SuperUserSeeder } from './super-user.seeder';
import { UserTermsSeeder } from './user-terms.seeder';

export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    await this.call(em, [SuperUserSeeder, UserTermsSeeder]);
  }
}
