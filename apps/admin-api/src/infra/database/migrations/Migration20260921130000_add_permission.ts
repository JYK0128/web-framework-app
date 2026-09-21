import { Migration } from '@mikro-orm/migrations';

// eslint-disable-next-line sonarjs/class-name
export class Migration20260921130000_add_permission extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`create table "permission" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "code" varchar(120) not null, "label" varchar(100) not null, "description" varchar(255) null, primary key ("id"));`);
    this.addSql(`alter table "permission" add constraint "permission_code_unique" unique ("code");`);
  }
}
