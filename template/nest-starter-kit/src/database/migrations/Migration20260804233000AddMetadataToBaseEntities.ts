import { Migration } from '@mikro-orm/migrations';

export class Migration20260804233000AddMetadataToBaseEntities extends Migration {
  override up(): void | Promise<void> {
    this.addSql('alter table `user` add column `metadata` text null;');
    this.addSql('alter table `session` add column `metadata` text null;');
    this.addSql('alter table `account` add column `metadata` text null;');
    this.addSql('alter table `verification` add column `metadata` text null;');
  }

  override down(): void | Promise<void> {
    this.addSql('alter table `user` drop column `metadata`;');
    this.addSql('alter table `session` drop column `metadata`;');
    this.addSql('alter table `account` drop column `metadata`;');
    this.addSql('alter table `verification` drop column `metadata`;');
  }
}
