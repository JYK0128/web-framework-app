import { Migration } from '@mikro-orm/migrations';

export class Migration20260817200000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`create table "inquiry_message" (
      "id" varchar(255) not null,
      "createdAt" timestamptz not null,
      "createdBy" varchar(255) null,
      "updatedAt" timestamptz not null,
      "updatedBy" varchar(255) null,
      "deletedAt" timestamptz null,
      "deletedBy" varchar(255) null,
      "metadata" jsonb null,
      "inquiry" varchar(255) not null,
      "author" varchar(255) not null,
      "authorRole" varchar(20) not null,
      "content" text not null,
      constraint "inquiry_message_pkey" primary key ("id")
    );`);
    this.addSql('alter table "inquiry_message" add constraint "inquiry_message_inquiry_foreign" foreign key ("inquiry") references "inquiry" ("id") on delete cascade;');
    this.addSql('alter table "inquiry_message" add constraint "inquiry_message_author_foreign" foreign key ("author") references "user" ("id") on delete cascade;');
    this.addSql('create index "inquiry_message_inquiry_created_at_index" on "inquiry_message" ("inquiry", "createdAt");');
  }

  override async down(): Promise<void> {
    this.addSql('drop table if exists "inquiry_message";');
  }
}
