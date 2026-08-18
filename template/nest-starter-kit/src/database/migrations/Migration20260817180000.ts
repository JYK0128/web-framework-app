import { Migration } from '@mikro-orm/migrations';

export class Migration20260817180000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`create table "inquiry" (
      "id" varchar(255) not null,
      "createdAt" timestamptz not null,
      "createdBy" varchar(255) null,
      "updatedAt" timestamptz not null,
      "updatedBy" varchar(255) null,
      "deletedAt" timestamptz null,
      "deletedBy" varchar(255) null,
      "metadata" jsonb null,
      "user" varchar(255) not null,
      "category" varchar(50) not null,
      "title" varchar(255) not null,
      "content" text not null,
      "status" varchar(20) not null default 'pending',
      "answer" text null,
      "answeredAt" timestamptz null,
      "answeredBy" varchar(255) null,
      constraint "inquiry_pkey" primary key ("id")
    );`);
    this.addSql('alter table "inquiry" add constraint "inquiry_user_foreign" foreign key ("user") references "user" ("id") on delete cascade;');
    this.addSql('alter table "inquiry" add constraint "inquiry_answeredBy_foreign" foreign key ("answeredBy") references "user" ("id") on delete set null;');
  }

  override async down(): Promise<void> {
    this.addSql('drop table if exists "inquiry";');
  }
}
