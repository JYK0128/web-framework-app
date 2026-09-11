import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

import { AccountSeeder } from './account.seeder';
import { FaqSeeder } from './faq.seeder';
import { MessageTemplateSeeder } from './message-template.seeder';
import { ResourceSeeder } from './resource.seeder';
import { RoleSeeder } from './role.seeder';
import { SystemConfigSeeder } from './system-config.seeder';
import { TermsSeeder } from './terms.seeder';
import { TestUserSeeder } from './test-user.seeder';

export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    await this.call(em, [ResourceSeeder, RoleSeeder, SystemConfigSeeder, TermsSeeder, AccountSeeder, TestUserSeeder, FaqSeeder, MessageTemplateSeeder]);
  }
}
