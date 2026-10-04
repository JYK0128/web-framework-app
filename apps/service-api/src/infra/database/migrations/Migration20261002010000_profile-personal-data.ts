import { Migration } from '@mikro-orm/migrations';

// eslint-disable-next-line sonarjs/class-name
export class Migration20261002010000_profile_personal_data extends Migration {
  override up(): void {
    this.addSql('alter table "profile" add column "name" varchar(120) null;');
    this.addSql('alter table "profile" add column "emailEncrypted" text null;');
    this.addSql('alter table "profile" add column "emailHash" varchar(64) null;');
    this.addSql('alter table "profile" add column "image" varchar(255) null;');
    this.addSql('update "profile" as p set "name" = u."name", "emailEncrypted" = u."emailEncrypted", "emailHash" = u."emailHash", "image" = u."image" from "user" as u where p."user" = u."id";');
    this.addSql('insert into "profile" ("id", "createdAt", "updatedAt", "user", "name", "emailEncrypted", "emailHash", "image") select concat(\'profile_\', u."id"), u."createdAt", u."updatedAt", u."id", u."name", u."emailEncrypted", u."emailHash", u."image" from "user" as u where not exists (select 1 from "profile" as p where p."user" = u."id");');
    this.addSql('alter table "profile" alter column "name" set not null, alter column "emailEncrypted" set not null, alter column "emailHash" set not null;');
    this.addSql('alter table "profile" add constraint "profile_emailHash_unique" unique ("emailHash");');
    this.addSql('alter table "user" drop column "name", drop column "emailEncrypted", drop column "emailHash", drop column "image";');
  }

  override down(): void {
    this.addSql('alter table "user" add column "name" varchar(120) null, add column "emailEncrypted" text null, add column "emailHash" varchar(64) null, add column "image" varchar(255) null;');
    this.addSql('update "user" as u set "name" = p."name", "emailEncrypted" = p."emailEncrypted", "emailHash" = p."emailHash", "image" = p."image" from "profile" as p where p."user" = u."id";');
    this.addSql('alter table "user" alter column "name" set not null, alter column "emailEncrypted" set not null, alter column "emailHash" set not null;');
    this.addSql('alter table "user" add constraint "user_emailHash_unique" unique ("emailHash");');
    this.addSql('alter table "profile" drop constraint "profile_emailHash_unique", drop column "name", drop column "emailEncrypted", drop column "emailHash", drop column "image";');
  }
}
