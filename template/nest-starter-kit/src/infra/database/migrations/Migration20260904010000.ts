import { Migration } from '@mikro-orm/migrations';

export class Migration20260904010000 extends Migration {
  override up(): void | Promise<void> {
    this.addSql('alter table "role" rename column "name" to "key";');
    this.addSql('alter index if exists "role_name_unique" rename to "role_key_unique";');
  }

  override down(): void | Promise<void> {
    this.addSql('alter index if exists "role_key_unique" rename to "role_name_unique";');
    this.addSql('alter table "role" rename column "key" to "name";');
  }
}
