import { Migration } from '@mikro-orm/migrations';

export class Migration20261012000000 extends Migration {
  override up(): void {
    this.addSql('create unique index "term_group_version_active_unique" on "term" ("termGroup", "version") where "deletedAt" is null;');
  }

  override down(): void {
    this.addSql('drop index "term_group_version_active_unique";');
  }
}
