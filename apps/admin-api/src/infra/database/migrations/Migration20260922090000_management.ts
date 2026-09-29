import { Migration } from '@mikro-orm/migrations';

// eslint-disable-next-line sonarjs/class-name
export class Migration20260922090000_management extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`create table "log_entry" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "level" text not null, "method" varchar(20) not null, "path" varchar(500) not null, "statusCode" int not null, "durationMs" int not null, "requestId" varchar(255) null, "ipAddress" varchar(255) null, "userAgent" varchar(500) null, "errorMessage" varchar(255) null, primary key ("id"));`);
    this.addSql(`create index "log_entry_level_index" on "log_entry" ("level");`);
    this.addSql(`create index "log_entry_method_index" on "log_entry" ("method");`);
    this.addSql(`create index "log_entry_path_index" on "log_entry" ("path");`);
    this.addSql(`create index "log_entry_statusCode_index" on "log_entry" ("statusCode");`);
    this.addSql(`create index "log_entry_requestId_index" on "log_entry" ("requestId");`);
    this.addSql(`alter table "log_entry" add constraint "log_entry_level_check" check ("level" in ('info', 'warn', 'error'));`);
  }
}
