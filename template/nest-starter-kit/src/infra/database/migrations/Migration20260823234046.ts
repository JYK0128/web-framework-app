import { Migration } from '@mikro-orm/migrations';

export class Migration20260823234046 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`create table "message_template" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "code" varchar(100) not null, "locale" varchar(10) not null default 'ko', "channel" varchar(30) not null, "name" varchar(100) not null, "title" varchar(255) null, "body" text not null, "variables" jsonb not null, "description" text null, "isActive" boolean not null default true, primary key ("id"));`);
    this.addSql(`alter table "message_template" add constraint "message_template_code_locale_unique" unique ("code", "locale");`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "message_template" cascade;`);
  }
}
