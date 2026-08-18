import { Migration } from '@mikro-orm/migrations';

export class Migration20260818200000 extends Migration {
  override async up(): Promise<void> {
    this.addSql('alter table "inquiry" add column if not exists "assignee" varchar(255) null;');
    this.addSql('alter table "inquiry" drop constraint if exists "inquiry_assignee_foreign";');
    this.addSql('alter table "inquiry" add constraint "inquiry_assignee_foreign" foreign key ("assignee") references "user" ("id") on delete set null;');
  }

  override async down(): Promise<void> {
    this.addSql('alter table "inquiry" drop constraint if exists "inquiry_assignee_foreign";');
    this.addSql('alter table "inquiry" drop column if exists "assignee";');
  }
}
