import { Migration } from '@mikro-orm/migrations';

export class Migration20261013010000 extends Migration {
  override up(): void {
    this.addSql('update "notice" set "publishedAt" = null where "status" = \'draft\';');
    this.addSql('update "notice" set "publishedAt" = coalesce("updatedAt", "createdAt") where "status" = \'published\' and "publishedAt" is null;');
    this.addSql('drop index if exists "notice_status_publishedAt_index";');
    this.addSql('alter table "notice" drop column "status";');
    this.addSql('create index "notice_publishedAt_index" on "notice" ("publishedAt");');
  }

  override down(): void {
    this.addSql('alter table "notice" add column "status" text not null default \'draft\';');
    this.addSql('update "notice" set "status" = \'published\' where "publishedAt" is not null;');
    this.addSql('drop index "notice_publishedAt_index";');
    this.addSql('create index "notice_status_publishedAt_index" on "notice" ("status", "publishedAt");');
  }
}
