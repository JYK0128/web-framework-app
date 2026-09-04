import { Migration } from '@mikro-orm/migrations';

export class Migration20260904000000 extends Migration {
  override up(): void | Promise<void> {
    this.addSql('alter table "resource" drop column if exists "category", drop column if exists "icon", drop column if exists "sortOrder";');
  }

  override down(): void | Promise<void> {
    this.addSql('alter table "resource" add "category" varchar(50) not null default \'general\', add "icon" varchar(50) null, add "sortOrder" int not null default 0;');
  }
}
