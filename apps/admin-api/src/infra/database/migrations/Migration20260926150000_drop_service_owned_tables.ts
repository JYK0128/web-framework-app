import { Migration } from '@mikro-orm/migrations';

// eslint-disable-next-line sonarjs/class-name
export class Migration20260926150000_drop_service_owned_tables extends Migration {
  override up(): void {
    this.addSql(`drop table "system_config";`);
    this.addSql(`drop table "upload";`);
  }

  override down(): void {
    this.addSql(`create table "system_config" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "code" text not null, "value" jsonb not null, "description" varchar(255) null, primary key ("id"));`);
    this.addSql(`create index "system_config_code_index" on "system_config" ("code");`);
    this.addSql(`alter table "system_config" add constraint "system_config_code_unique" unique ("code");`);
    this.addSql(`alter table "system_config" add constraint "system_config_code_check" check ("code" in ('operation', 'maintenance', 'security', 'inquiry', 'notification', 'oauth'));`);
    this.addSql(`create table "upload" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "originalName" varchar(255) not null, "storedName" varchar(255) not null, "mimeType" varchar(100) not null, "size" int not null default 0, "subDir" varchar(100) not null, "url" varchar(500) not null, "status" text not null default 'pending', primary key ("id"));`);
    this.addSql(`create index "upload_storedName_index" on "upload" ("storedName");`);
    this.addSql(`create index "upload_subDir_index" on "upload" ("subDir");`);
    this.addSql(`create index "upload_status_index" on "upload" ("status");`);
    this.addSql(`alter table "upload" add constraint "upload_status_check" check ("status" in ('pending', 'ready', 'failed'));`);
  }
}
