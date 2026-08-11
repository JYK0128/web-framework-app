import { Migration } from '@mikro-orm/migrations';

export class Migration20260811140000AddTwoFactorPluginFields extends Migration {
  override async up(): Promise<void> {
    const columns = await this.execute('pragma table_info(`twoFactor`);');
    if (!columns.some((column) => column.name === 'verified')) {
      this.addSql('alter table `twoFactor` add column `verified` integer not null default false;');
    }
    if (!columns.some((column) => column.name === 'failedVerificationCount')) {
      this.addSql('alter table `twoFactor` add column `failedVerificationCount` integer not null default 0;');
    }
    if (!columns.some((column) => column.name === 'lockedUntil')) {
      this.addSql('alter table `twoFactor` add column `lockedUntil` datetime null;');
    }
  }

  override down(): void | Promise<void> {
    this.addSql('alter table `twoFactor` drop column `lockedUntil`;');
    this.addSql('alter table `twoFactor` drop column `failedVerificationCount`;');
    this.addSql('alter table `twoFactor` drop column `verified`;');
  }
}
