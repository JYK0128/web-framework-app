import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

import { AdminTermsSeeder } from './admin-terms.seeder';
import { PermissionsSeeder } from './permissions.seeder';
import { SuperAdminSeeder } from './super-admin.seeder';
import { SystemConfigSeeder } from './system-config.seeder';

export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    await this.call(em, [SuperAdminSeeder, PermissionsSeeder, AdminTermsSeeder, SystemConfigSeeder]);
  }
}
