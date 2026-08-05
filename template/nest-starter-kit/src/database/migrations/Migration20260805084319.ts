import { Migration } from '@mikro-orm/migrations';

export class Migration20260805084319 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`alter table \`user\` drop column \`twoFactorAuthSecret\`;`);
    this.addSql(`alter table \`user\` rename column \`isTwoFactorAuthEnabled\` to \`twoFactorEnabled\`;`);

    this.addSql(`alter table \`account\` drop column \`failedLoginAttempts\`;`);
    this.addSql(`alter table \`account\` drop column \`lockedUntil\`;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table \`account\` add column \`failedLoginAttempts\` integer not null default 0;`);
    this.addSql(`alter table \`account\` add column \`lockedUntil\` datetime null;`);

    this.addSql(`alter table \`user\` add column \`twoFactorAuthSecret\` text null;`);
    this.addSql(`alter table \`user\` rename column \`twoFactorEnabled\` to \`isTwoFactorAuthEnabled\`;`);
  }
}
