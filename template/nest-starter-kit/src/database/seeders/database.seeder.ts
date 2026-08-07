import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

import { AuthSeeder } from './auth.seeder';
import { RoleSeeder } from './role.seeder';
import { TermsSeeder } from './terms.seeder';

export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    await this.call(em, [RoleSeeder, AuthSeeder, TermsSeeder]);
  }
}
