import { Migration } from '@mikro-orm/migrations';

export class Migration20260819180000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "verification" (
        "id" varchar(255) not null,
        "identifier" varchar(64) not null,
        "value" text not null,
        "expiresAt" timestamptz not null,
        "createdAt" timestamptz not null default now(),
        "updatedAt" timestamptz not null default now(),
        constraint "verification_pkey" primary key ("id")
      );
    `);
    // Verification records are short-lived and older rows are not encrypted with
    // the current APP_SECRET contract, so they must not survive this migration.
    this.addSql('delete from "verification";');
    this.addSql('alter table "verification" alter column "identifier" type varchar(64) using ("identifier"::varchar(64));');
    this.addSql('alter table "verification" drop column if exists "createdBy";');
    this.addSql('alter table "verification" drop column if exists "updatedBy";');
    this.addSql('alter table "verification" drop column if exists "deletedAt";');
    this.addSql('alter table "verification" drop column if exists "deletedBy";');
    this.addSql('alter table "verification" drop column if exists "metadata";');
    this.addSql(`
      do $$
      begin
        if not exists (
          select 1 from pg_constraint where conname = 'verification_identifier_unique'
        ) then
          alter table "verification"
            add constraint "verification_identifier_unique" unique ("identifier");
        end if;
      end $$;
    `);
    this.addSql('create index if not exists "verification_expiresAt_index" on "verification" ("expiresAt");');
  }

  override async down(): Promise<void> {
    this.addSql('drop table if exists "verification";');
  }
}
