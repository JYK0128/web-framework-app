import { Migration } from '@mikro-orm/migrations';

export class Migration20260819000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "session" (
        "id" varchar(255) not null,
        "userId" varchar(255) not null,
        "token" varchar(255) not null,
        "expiresAt" timestamptz not null,
        "ipAddress" varchar(255) null,
        "userAgent" text null,
        "createdAt" timestamptz not null default now(),
        "updatedAt" timestamptz not null default now(),
        constraint "session_pkey" primary key ("id"),
        constraint "session_token_unique" unique ("token"),
        constraint "session_userId_foreign" foreign key ("userId") references "user" ("id") on delete cascade
      );
    `);
    this.addSql('create index if not exists "session_userId_index" on "session" ("userId");');
    this.addSql('create index if not exists "session_expiresAt_index" on "session" ("expiresAt");');
  }

  override async down(): Promise<void> {
    this.addSql('drop table if exists "session";');
  }
}
