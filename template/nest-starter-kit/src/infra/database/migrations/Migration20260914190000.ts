import { Migration } from '@mikro-orm/migrations';

/** Add the board-style support ticket domain independently from inquiry chat. */
export class Migration20260914190000 extends Migration {
  override up(): void {
    this.addSql(`
      create table if not exists "support_ticket" (
        "id" varchar(255) not null,
        "createdAt" timestamptz not null,
        "createdBy" varchar(255) null,
        "updatedAt" timestamptz not null,
        "updatedBy" varchar(255) null,
        "deletedAt" timestamptz null,
        "deletedBy" varchar(255) null,
        "metadata" jsonb null,
        "user" varchar(255) not null,
        "assignee" varchar(255) null,
        "category" varchar(50) not null,
        "title" varchar(255) not null,
        "content" text not null,
        "priority" varchar(20) not null default 'normal',
        "status" varchar(20) not null default 'open',
        "resolution" text null,
        primary key ("id")
      );
    `);
    this.addSql('create index if not exists "support_ticket_user_index" on "support_ticket" ("user");');
    this.addSql('create index if not exists "support_ticket_status_index" on "support_ticket" ("status");');
    this.addSql('create index if not exists "support_ticket_assignee_index" on "support_ticket" ("assignee");');
    this.addSql('alter table "support_ticket" add constraint "support_ticket_user_foreign" foreign key ("user") references "user" ("id") on delete cascade;');
    this.addSql('alter table "support_ticket" add constraint "support_ticket_assignee_foreign" foreign key ("assignee") references "user" ("id") on delete set null;');
  }

  override down(): void {
    this.addSql('drop table if exists "support_ticket" cascade;');
  }
}
