import { Migration } from '@mikro-orm/migrations';

/** Move message template delivery channels into the normalized channel table. */
export class Migration20260908000000 extends Migration {
  override up(): void {
    this.addSql(`
      create table if not exists "message_template_channel" (
        "id" varchar(255) not null,
        "createdAt" timestamptz not null,
        "createdBy" varchar(255) null,
        "updatedAt" timestamptz not null,
        "updatedBy" varchar(255) null,
        "deletedAt" timestamptz null,
        "deletedBy" varchar(255) null,
        "metadata" jsonb null,
        "template" varchar(255) not null,
        "channel" varchar(30) not null,
        "title" varchar(255) null,
        "body" text not null,
        "priority" int not null default 1,
        "isActive" boolean not null default true,
        "extraConfig" jsonb null,
        constraint "message_template_channel_pkey" primary key ("id"),
        constraint "message_template_channel_template_foreign"
          foreign key ("template") references "message_template" ("id") on delete cascade,
        constraint "message_template_channel_template_channel_unique"
          unique ("template", "channel")
      );
    `);
    this.addSql(`alter table "message_template" drop column if exists "channel";`);
    this.addSql(`alter table "message_template" drop column if exists "locale";`);
    this.addSql(`alter table "message_template" drop column if exists "title";`);
    this.addSql(`alter table "message_template" drop column if exists "body";`);
  }

  override down(): void {
    this.addSql(`drop table if exists "message_template_channel" cascade;`);
  }
}
