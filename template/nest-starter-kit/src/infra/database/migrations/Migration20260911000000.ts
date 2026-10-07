import { Migration } from '@mikro-orm/migrations';

export class Migration20260911000000 extends Migration {
  override up(): void {
    this.addSql('alter table "user" add column "role_id" varchar(255) null;');
    this.addSql(`
      update "user" as app_user
      set "role_id" = role."id"
      from "role" as role
      where app_user."role" = role."key";
    `);
    this.addSql('alter table "user" drop column "role";');
    this.addSql('alter table "user" rename column "role_id" to "role";');
    this.addSql('alter table "user" add constraint "user_role_foreign" foreign key ("role") references "role" ("id") on delete set null;');
    this.addSql('create index "user_role_index" on "user" ("role");');
  }

  override down(): void {
    this.addSql('alter table "user" add column "role_key" varchar(50) null;');
    this.addSql(`
      update "user" as app_user
      set "role_key" = role."key"
      from "role" as role
      where app_user."role" = role."id";
    `);
    this.addSql('alter table "user" drop constraint "user_role_foreign";');
    this.addSql('drop index if exists "user_role_index";');
    this.addSql('alter table "user" drop column "role";');
    this.addSql('alter table "user" rename column "role_key" to "role";');
  }
}
