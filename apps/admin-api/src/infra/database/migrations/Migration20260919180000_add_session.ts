import { Migration } from '@mikro-orm/migrations';

// eslint-disable-next-line sonarjs/class-name
export class Migration20260919180000_add_session extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`create table "session" ("id" varchar(255) not null, "userId" varchar(255) not null, "token" varchar(255) not null, "expiresAt" timestamptz not null, "ipAddress" varchar(255) null, "userAgent" text null, "createdAt" timestamptz not null, "updatedAt" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "session" add constraint "session_token_unique" unique ("token");`);
    this.addSql(`alter table "session" add constraint "session_userId_foreign" foreign key ("userId") references "user" ("id") on delete cascade;`);
    this.addSql(`create index "session_expiresAt_index" on "session" ("expiresAt");`);
  }
}
