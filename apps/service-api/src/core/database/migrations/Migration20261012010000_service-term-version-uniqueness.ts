import { Migration } from '@mikro-orm/migrations';

export class Migration20261012010000 extends Migration {
  override up(): void {
    this.addSql('alter table "term" add constraint "service_term_group_version_unique" unique ("termGroup", "version");');
  }

  override down(): void {
    this.addSql('alter table "term" drop constraint "service_term_group_version_unique";');
  }
}
