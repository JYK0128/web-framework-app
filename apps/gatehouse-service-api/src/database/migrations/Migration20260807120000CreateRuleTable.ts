import { Migration } from '@mikro-orm/migrations';

export class Migration20260807120000CreateRuleTable extends Migration {
  override up(): void | Promise<void> {
    this.addSql('create table `rule` (`id` text not null primary key, `createdAt` datetime not null, `createdBy` text null, `updatedAt` datetime not null, `updatedBy` text null, `deletedAt` datetime null, `deletedBy` text null, `metadata` json null, `code` varchar(30) not null, `permissions` json not null);');
    this.addSql('create unique index `rule_code_unique` on `rule` (`code`);');
  }

  override down(): void | Promise<void> {
    this.addSql('drop table if exists `rule`;');
  }
}
