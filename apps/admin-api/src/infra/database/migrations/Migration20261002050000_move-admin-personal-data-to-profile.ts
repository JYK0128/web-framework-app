import { Migration } from '@mikro-orm/migrations';

export class Migration20261002050000 extends Migration {
  override up(): void {
    this.addSql('alter table "profile" add column "name" varchar(120) null, add column "emailEncrypted" text null, add column "emailHash" varchar(64) null, add column "image" varchar(255) null, add column "phoneNumberEncrypted" text null, add column "phoneNumberHash" varchar(64) null;');
    this.addSql('insert into "profile" ("id", "createdAt", "createdBy", "updatedAt", "updatedBy", "user") select gen_random_uuid()::text, u."createdAt", u."createdBy", u."updatedAt", u."updatedBy", u."id" from "user" u where not exists (select 1 from "profile" p where p."user" = u."id");');
    this.addSql('update "profile" p set "name" = u."name", "emailEncrypted" = u."emailEncrypted", "emailHash" = u."emailHash", "image" = u."image", "phoneNumberEncrypted" = u."phoneNumberEncrypted", "phoneNumberHash" = u."phoneNumberHash" from "user" u where p."user" = u."id";');
    this.addSql('alter table "profile" alter column "name" set not null, alter column "emailEncrypted" set not null, alter column "emailHash" set not null;');
    this.addSql('alter table "profile" add constraint "profile_emailHash_unique" unique ("emailHash"), add constraint "profile_phoneNumberHash_unique" unique ("phoneNumberHash");');
    this.addSql('alter table "user" drop column "name", drop column "emailEncrypted", drop column "emailHash", drop column "image", drop column "phoneNumberEncrypted", drop column "phoneNumberHash";');
  }

  override down(): void {
    this.addSql('alter table "user" add column "name" varchar(120) null, add column "emailEncrypted" text null, add column "emailHash" varchar(64) null, add column "image" varchar(255) null, add column "phoneNumberEncrypted" text null, add column "phoneNumberHash" varchar(64) null;');
    this.addSql('update "user" u set "name" = p."name", "emailEncrypted" = p."emailEncrypted", "emailHash" = p."emailHash", "image" = p."image", "phoneNumberEncrypted" = p."phoneNumberEncrypted", "phoneNumberHash" = p."phoneNumberHash" from "profile" p where p."user" = u."id";');
    this.addSql('alter table "user" alter column "name" set not null, alter column "emailEncrypted" set not null, alter column "emailHash" set not null;');
    this.addSql('alter table "user" add constraint "user_emailHash_unique" unique ("emailHash"), add constraint "user_phoneNumberHash_unique" unique ("phoneNumberHash");');
    this.addSql('alter table "profile" drop column "name", drop column "emailEncrypted", drop column "emailHash", drop column "image", drop column "phoneNumberEncrypted", drop column "phoneNumberHash";');
  }
}
