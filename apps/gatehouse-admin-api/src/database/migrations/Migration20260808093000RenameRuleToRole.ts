import { Migration } from '@mikro-orm/migrations';

export class Migration20260808093000RenameRuleToRole extends Migration {
  override up(): void | Promise<void> {
    this.addSql('drop index if exists `rule_code_unique`;');
    this.addSql('alter table `rule` rename to `role`;');
    this.addSql('alter table `role` rename column `code` to `role`;');
    this.addSql('create unique index `role_role_unique` on `role` (`role`);');
  }

  override down(): void | Promise<void> {
    this.addSql('drop index if exists `role_role_unique`;');
    this.addSql('alter table `role` rename column `role` to `code`;');
    this.addSql('alter table `role` rename to `rule`;');
    this.addSql('create unique index `rule_code_unique` on `rule` (`code`);');
  }
}
