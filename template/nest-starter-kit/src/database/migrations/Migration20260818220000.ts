import { Migration } from '@mikro-orm/migrations';

export class Migration20260818220000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "alert" (
        "id" varchar(255) not null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        "user" varchar(255) not null,
        "type" varchar(50) not null,
        "title" varchar(255) not null,
        "content" text not null,
        "link_url" varchar(500) null,
        "is_read" boolean not null default false,
        "read_at" timestamptz null,
        constraint "alert_pkey" primary key ("id")
      );
    `);

    this.addSql('create index if not exists "alert_user_index" on "alert" ("user");');
    this.addSql('create index if not exists "alert_is_read_index" on "alert" ("is_read");');
    this.addSql('create index if not exists "alert_created_at_index" on "alert" ("created_at");');

    this.addSql('alter table "alert" drop constraint if exists "alert_user_foreign";');
    this.addSql('alter table "alert" add constraint "alert_user_foreign" foreign key ("user") references "user" ("id") on delete cascade;');
  }

  override async down(): Promise<void> {
    this.addSql('drop table if exists "alert" cascade;');
  }
}
