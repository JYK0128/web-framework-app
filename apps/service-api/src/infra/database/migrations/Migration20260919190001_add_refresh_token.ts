import { Migration } from '@mikro-orm/migrations';

// eslint-disable-next-line sonarjs/class-name
export class Migration20260919190001_add_refresh_token extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`create table "refresh_token" ("id" varchar(255) not null, "userId" varchar(255) not null, "tokenHash" varchar(64) not null, "familyId" varchar(255) not null, "rememberMe" boolean not null, "expiresAt" timestamptz not null, "usedAt" timestamptz null, "revokedAt" timestamptz null, "createdAt" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "refresh_token" add constraint "refresh_token_tokenHash_unique" unique ("tokenHash");`);
    this.addSql(`alter table "refresh_token" add constraint "refresh_token_userId_foreign" foreign key ("userId") references "user" ("id") on delete cascade;`);
    this.addSql(`create index "refresh_token_familyId_index" on "refresh_token" ("familyId");`);
    this.addSql(`create index "refresh_token_expiresAt_index" on "refresh_token" ("expiresAt");`);
  }
}
