import { Migration } from '@mikro-orm/migrations';

export class Migration20260805084319 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`alter table \`user\` add column \`twoFactorEnabled\` integer not null default 0;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table \`user\` drop column \`twoFactorEnabled\`;`);
  }
}
