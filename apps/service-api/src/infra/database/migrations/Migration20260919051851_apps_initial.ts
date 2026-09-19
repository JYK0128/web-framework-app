import { Migration } from '@mikro-orm/migrations';

// eslint-disable-next-line sonarjs/class-name
export class Migration20260919051851_apps_initial extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`create table "role" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "code" varchar(50) not null, "label" varchar(100) null, "description" varchar(255) null, "isSystem" boolean not null default false, "permissions" text[] not null default '{}', primary key ("id"));`);
    this.addSql(`alter table "role" add constraint "role_code_unique" unique ("code");`);

    this.addSql(`create table "system_config" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "code" text not null, "value" jsonb not null, "description" varchar(255) null, primary key ("id"));`);
    this.addSql(`create index "system_config_code_index" on "system_config" ("code");`);
    this.addSql(`alter table "system_config" add constraint "system_config_code_unique" unique ("code");`);
    this.addSql(`alter table "system_config" add constraint "system_config_code_check" check ("code" in ('operation', 'maintenance', 'security', 'inquiry', 'notification', 'oauth'));`);

    this.addSql(`create table "term_group" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "code" varchar(50) not null, "title" varchar(255) not null, "isRequired" boolean not null default false, "sortOrder" int not null default 0, primary key ("id"));`);
    this.addSql(`alter table "term_group" add constraint "term_group_code_unique" unique ("code");`);

    this.addSql(`create table "term" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "termGroup" varchar(255) not null, "version" varchar(50) not null, "content" text not null, "publishedAt" timestamptz null, primary key ("id"));`);

    this.addSql(`create table "upload" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "originalName" varchar(255) not null, "storedName" varchar(255) not null, "mimeType" varchar(100) not null, "size" int not null default 0, "subDir" varchar(100) not null, "url" varchar(500) not null, "status" text not null default 'pending', primary key ("id"));`);
    this.addSql(`create index "upload_storedName_index" on "upload" ("storedName");`);
    this.addSql(`create index "upload_subDir_index" on "upload" ("subDir");`);
    this.addSql(`create index "upload_status_index" on "upload" ("status");`);
    this.addSql(`alter table "upload" add constraint "upload_status_check" check ("status" in ('pending', 'ready', 'failed'));`);

    this.addSql(`create table "user" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "name" varchar(120) not null, "email" varchar(320) not null, "emailVerified" boolean not null default false, "image" varchar(255) null, "twoFactorEnabled" boolean not null default false, "banned" boolean not null default false, "banReason" varchar(255) null, "banExpires" timestamptz null, "role" varchar(255) null, primary key ("id"));`);
    this.addSql(`alter table "user" add constraint "user_email_unique" unique ("email");`);

    this.addSql(`create table "twoFactor" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "secret" varchar(255) not null, "backupCodes" varchar(255) null, "verified" boolean not null default false, "failedVerificationCount" int not null default 0, "lockedUntil" timestamptz null, "user" varchar(255) not null, primary key ("id"));`);

    this.addSql(`create table "profile" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "user" varchar(255) not null, "employeeNo" varchar(50) null, "department" varchar(100) null, "phoneNumber" varchar(30) null, primary key ("id"));`);
    this.addSql(`alter table "profile" add constraint "profile_user_unique" unique ("user");`);
    this.addSql(`alter table "profile" add constraint "profile_employeeNo_unique" unique ("employeeNo");`);
    this.addSql(`alter table "profile" add constraint "profile_phoneNumber_unique" unique ("phoneNumber");`);

    this.addSql(`create table "account" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "user" varchar(255) not null, "accountId" varchar(255) not null, "providerId" varchar(255) not null, "accessToken" text null, "refreshToken" text null, "accessTokenExpiresAt" timestamptz null, "refreshTokenExpiresAt" timestamptz null, "scope" text null, "idToken" text null, "password" text null, "metadata" jsonb null, primary key ("id"));`);

    this.addSql(`create table "user_term_agreement" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "user" varchar(255) not null, "term" varchar(255) not null, "isAgreed" boolean not null, primary key ("id"));`);

    this.addSql(`alter table "term" add constraint "term_termGroup_foreign" foreign key ("termGroup") references "term_group" ("id") on delete cascade;`);

    this.addSql(`alter table "user" add constraint "user_role_foreign" foreign key ("role") references "role" ("id") on delete set null;`);

    this.addSql(`alter table "twoFactor" add constraint "twoFactor_user_foreign" foreign key ("user") references "user" ("id") on delete cascade;`);

    this.addSql(`alter table "profile" add constraint "profile_user_foreign" foreign key ("user") references "user" ("id");`);

    this.addSql(`alter table "account" add constraint "account_user_foreign" foreign key ("user") references "user" ("id") on delete cascade;`);

    this.addSql(`alter table "user_term_agreement" add constraint "user_term_agreement_user_foreign" foreign key ("user") references "user" ("id") on delete cascade;`);
    this.addSql(`alter table "user_term_agreement" add constraint "user_term_agreement_term_foreign" foreign key ("term") references "term" ("id") on delete cascade;`);
  }
}
