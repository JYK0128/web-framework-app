import { Migration } from '@mikro-orm/migrations';

export class Migration20260805000000AddAnonymousUser extends Migration {
  override up(): void | Promise<void> {
    this.addSql('alter table `user` add column `isAnonymous` integer not null default false;');
  }

  override down(): void | Promise<void> {
    this.addSql('alter table `user` drop column `isAnonymous`;');
  }
}
