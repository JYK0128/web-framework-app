import { Migration } from '@mikro-orm/migrations';

export class Migration20260903050536 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`alter table "role" add "label" varchar(100) null, add "description" varchar(255) null, add "isSystem" boolean not null default false;`);
    this.addSql(`alter table "role" alter column "name" type varchar(50) using ("name"::varchar(50));`);

    this.addSql(`alter table "user" alter column "role" type varchar(50) using ("role"::varchar(50));`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "role" drop column "label", drop column "description", drop column "isSystem";`);
    this.addSql(`alter table "role" alter column "name" type varchar(30) using ("name"::varchar(30));`);

    this.addSql(`alter table "user" alter column "role" type varchar(30) using ("role"::varchar(30));`);
  }
}
