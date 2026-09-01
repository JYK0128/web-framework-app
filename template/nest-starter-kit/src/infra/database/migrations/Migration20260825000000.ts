import { Migration } from '@mikro-orm/migrations';

export class Migration20260825000000 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`alter table "faq" drop column if exists "helpfulCount";`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "faq" add column if not exists "helpfulCount" int not null default 0;`);
  }
}
