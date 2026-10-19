import { Migration } from '@mikro-orm/migrations';

export class Migration20261013020000 extends Migration {
  override up(): void {
    this.addSql('update "event" set "publishedAt" = null where "status" = \'draft\';');
    this.addSql('update "event" set "publishedAt" = coalesce("updatedAt", "createdAt") where "status" = \'published\' and "publishedAt" is null;');
    this.addSql('drop index if exists "event_status_startsAt_index";');
    this.addSql('alter table "event" drop column "status";');
    this.addSql('create index "event_publishedAt_index" on "event" ("publishedAt");');
  }

  override down(): void {
    this.addSql('alter table "event" add column "status" text not null default \'draft\';');
    this.addSql('alter table "event" add constraint "event_status_check" check ("status" in (\'draft\', \'published\'));');
    this.addSql('update "event" set "status" = \'published\' where "publishedAt" is not null;');
    this.addSql('drop index "event_publishedAt_index";');
    this.addSql('create index "event_status_startsAt_index" on "event" ("status", "startsAt");');
  }
}
