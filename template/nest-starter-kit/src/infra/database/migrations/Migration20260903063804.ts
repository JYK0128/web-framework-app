import { Migration } from '@mikro-orm/migrations';

export class Migration20260903063804 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`create table "resource" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "key" varchar(50) not null, "label" varchar(100) not null, "category" varchar(50) not null default 'general', "description" varchar(255) null, "icon" varchar(50) null, "actions" jsonb not null, "sortOrder" int not null default 0, primary key ("id"));`);
    this.addSql(`alter table "resource" add constraint "resource_key_unique" unique ("key");`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "resource" cascade;`);
  }
}
