import { Migration } from '@mikro-orm/migrations';

export class Migration20260817210000 extends Migration {
  override async up(): Promise<void> {
    this.addSql('alter table "inquiry" drop constraint if exists "inquiry_answeredBy_foreign";');
    this.addSql('alter table "inquiry" drop column if exists "answer";');
    this.addSql('alter table "inquiry" drop column if exists "answeredAt";');
    this.addSql('alter table "inquiry" drop column if exists "answeredBy";');
  }

  override async down(): Promise<void> {
    this.addSql('alter table "inquiry" add column if not exists "answer" text null;');
    this.addSql('alter table "inquiry" add column if not exists "answeredAt" timestamptz null;');
    this.addSql('alter table "inquiry" add column if not exists "answeredBy" varchar(255) null;');
    this.addSql('alter table "inquiry" add constraint "inquiry_answeredBy_foreign" foreign key ("answeredBy") references "user" ("id") on delete set null;');
  }
}
