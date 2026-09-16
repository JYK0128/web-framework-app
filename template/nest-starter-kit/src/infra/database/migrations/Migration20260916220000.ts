import { Migration } from '@mikro-orm/migrations';

/** Add upload table for tracking storage files and upload statuses. */
export class Migration20260916220000 extends Migration {
  override up(): void {
    this.addSql(`
      create table if not exists "upload" (
        "id" varchar(255) not null,
        "createdAt" timestamptz not null,
        "createdBy" varchar(255) null,
        "updatedAt" timestamptz not null,
        "updatedBy" varchar(255) null,
        "deletedAt" timestamptz null,
        "deletedBy" varchar(255) null,
        "metadata" jsonb null,
        "originalName" varchar(255) not null,
        "storedName" varchar(255) not null,
        "mimeType" varchar(100) not null,
        "size" integer not null default 0,
        "subDir" varchar(100) not null,
        "url" varchar(500) not null,
        "status" varchar(50) not null default 'PENDING',
        "uploaderId" varchar(255) null,
        primary key ("id")
      );
    `);
    this.addSql('create index if not exists "upload_storedName_index" on "upload" ("storedName");');
    this.addSql('create index if not exists "upload_subDir_index" on "upload" ("subDir");');
    this.addSql('create index if not exists "upload_status_index" on "upload" ("status");');
    this.addSql('create index if not exists "upload_uploaderId_index" on "upload" ("uploaderId");');
    this.addSql('alter table "upload" drop constraint if exists "upload_status_check";');
    this.addSql(`
      alter table "upload"
      add constraint "upload_status_check"
      check ("status" in ('PENDING', 'READY', 'FAILED'));
    `);
  }

  override down(): void {
    this.addSql('drop table if exists "upload" cascade;');
  }
}
