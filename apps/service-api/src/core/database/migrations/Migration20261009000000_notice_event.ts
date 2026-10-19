import { Migration } from '@mikro-orm/migrations';

// eslint-disable-next-line sonarjs/class-name
export class Migration20261009000000_notice_event extends Migration {
  override up(): void {
    this.addSql('create table "notice" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "title" varchar(255) not null, "content" text not null, "importance" text not null default \'normal\', "isPinned" boolean not null default false, "status" text not null default \'draft\', "publishedAt" timestamptz null, primary key ("id"));');
    this.addSql('alter table "notice" add constraint "notice_importance_check" check ("importance" in (\'normal\', \'important\', \'urgent\'));');
    this.addSql('alter table "notice" add constraint "notice_status_check" check ("status" in (\'draft\', \'published\'));');
    this.addSql('create index "notice_status_publishedAt_index" on "notice" ("status", "publishedAt");');
    this.addSql('create table "event" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "title" varchar(255) not null, "content" text not null, "startsAt" timestamptz not null, "endsAt" timestamptz not null, "imageUrl" varchar(500) null, "linkUrl" varchar(500) null, "status" text not null default \'draft\', "publishedAt" timestamptz null, primary key ("id"));');
    this.addSql('alter table "event" add constraint "event_status_check" check ("status" in (\'draft\', \'published\'));');
    this.addSql('alter table "event" add constraint "event_period_check" check ("endsAt" > "startsAt");');
    this.addSql('create index "event_status_startsAt_index" on "event" ("status", "startsAt");');
  }

  override down(): void {
    this.addSql('drop table if exists "event" cascade;');
    this.addSql('drop table if exists "notice" cascade;');
  }
}
