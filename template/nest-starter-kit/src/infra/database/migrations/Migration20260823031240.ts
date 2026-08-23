import { Migration } from '@mikro-orm/migrations';

export class Migration20260823031240 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`create table "faq" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "category" varchar(50) not null, "question" varchar(255) not null, "answer" text not null, "order" int not null default 0, "isPublished" boolean not null default true, "helpfulCount" int not null default 0, primary key ("id"));`);

    this.addSql(`create table "notice" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "title" varchar(255) not null, "content" text not null, "priority" int not null default 0, "publishedAt" timestamptz null, "expiresAt" timestamptz null, primary key ("id"));`);

    this.addSql(`create table "role" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "name" varchar(30) not null, "permissions" jsonb not null, primary key ("id"));`);
    this.addSql(`alter table "role" add constraint "role_name_unique" unique ("name");`);

    this.addSql(`create table "system_config" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "key" varchar(100) not null, "category" text not null, "value" jsonb not null, "isPublic" boolean not null default false, "description" varchar(255) null, primary key ("id"));`);
    this.addSql(`create index "system_config_key_index" on "system_config" ("key");`);
    this.addSql(`alter table "system_config" add constraint "system_config_key_unique" unique ("key");`);
    this.addSql(`create index "system_config_category_index" on "system_config" ("category");`);
    this.addSql(`alter table "system_config" add constraint "system_config_category_check" check ("category" in ('AUTH', 'SYSTEM', 'NOTIFICATION', 'INQUIRY'));`);

    this.addSql(`create table "term_group" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "code" varchar(50) not null, "title" varchar(255) not null, "isRequired" boolean not null default false, "sortOrder" int not null default 0, primary key ("id"));`);
    this.addSql(`alter table "term_group" add constraint "term_group_code_unique" unique ("code");`);

    this.addSql(`create table "term" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "termGroup" varchar(255) not null, "version" varchar(50) not null, "content" text not null, "publishedAt" timestamptz null, primary key ("id"));`);

    this.addSql(`create table "user" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "name" varchar(120) not null, "image" varchar(255) null, "email" varchar(320) not null, "emailVerified" boolean not null default false, "phoneNumber" varchar(30) null, "phoneNumberVerified" boolean not null default false, "twoFactorEnabled" boolean not null default false, "banned" boolean not null default false, "banReason" varchar(255) null, "banExpires" timestamptz null, "role" varchar(30) null, primary key ("id"));`);
    this.addSql(`alter table "user" add constraint "user_email_unique" unique ("email");`);
    this.addSql(`alter table "user" add constraint "user_phoneNumber_unique" unique ("phoneNumber");`);

    this.addSql(`create table "twoFactor" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "secret" varchar(255) not null, "backupCodes" varchar(255) null, "verified" boolean not null default false, "failedVerificationCount" int not null default 0, "lockedUntil" timestamptz null, "user" varchar(255) not null, primary key ("id"));`);

    this.addSql(`create table "session" ("id" varchar(255) not null, "userId" varchar(255) not null, "token" varchar(255) not null, "expiresAt" timestamptz not null, "ipAddress" varchar(255) null, "userAgent" text null, "createdAt" timestamptz not null, "updatedAt" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "session" add constraint "session_token_unique" unique ("token");`);

    this.addSql(`create table "notice_read" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "user" varchar(255) not null, "notice" varchar(255) not null, "readAt" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "notice_read" add constraint "notice_read_user_notice_unique" unique ("user", "notice");`);

    this.addSql(`create table "inquiry" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "user" varchar(255) not null, "assignee" varchar(255) null, "category" varchar(50) not null, "title" varchar(255) not null, "content" text not null, "status" varchar(20) not null default 'pending', primary key ("id"));`);

    this.addSql(`create table "inquiry_message" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "inquiry" varchar(255) not null, "author" varchar(255) not null, "authorRole" varchar(20) not null, "content" text not null, primary key ("id"));`);

    this.addSql(`create table "alert" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "user" varchar(255) not null, "type" text not null, "title" varchar(255) not null, "content" text not null, "linkUrl" varchar(500) null, "isRead" boolean not null default false, "readAt" timestamptz null, primary key ("id"));`);
    this.addSql(`create index "alert_user_index" on "alert" ("user");`);
    this.addSql(`create index "alert_isRead_index" on "alert" ("isRead");`);
    this.addSql(`alter table "alert" add constraint "alert_type_check" check ("type" in ('inquiry_reply', 'inquiry_message', 'notice', 'system'));`);

    this.addSql(`create table "account" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "user" varchar(255) not null, "accountId" varchar(255) not null, "providerId" varchar(255) not null, "accessToken" text null, "refreshToken" text null, "accessTokenExpiresAt" timestamptz null, "refreshTokenExpiresAt" timestamptz null, "scope" text null, "idToken" text null, "password" text null, "metadata" jsonb null, primary key ("id"));`);

    this.addSql(`create table "user_identity" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "user" varchar(255) not null, "name" varchar(120) not null, "di" varchar(100) null, "ci" varchar(120) null, "birthDate" varchar(20) null, "gender" varchar(10) null, "verifiedAt" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "user_identity" add constraint "user_identity_user_unique" unique ("user");`);
    this.addSql(`alter table "user_identity" add constraint "user_identity_di_unique" unique ("di");`);
    this.addSql(`alter table "user_identity" add constraint "user_identity_ci_unique" unique ("ci");`);

    this.addSql(`create table "user_term_agreement" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "user" varchar(255) not null, "term" varchar(255) not null, "isAgreed" boolean not null, primary key ("id"));`);

    this.addSql(`create table "verification" ("id" varchar(255) not null, "identifier" varchar(64) not null, "value" text not null, "expiresAt" timestamptz not null, "createdAt" timestamptz not null, "updatedAt" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "verification" add constraint "verification_identifier_unique" unique ("identifier");`);

    this.addSql(`alter table "term" add constraint "term_termGroup_foreign" foreign key ("termGroup") references "term_group" ("id") on delete cascade;`);

    this.addSql(`alter table "twoFactor" add constraint "twoFactor_user_foreign" foreign key ("user") references "user" ("id") on delete cascade;`);

    this.addSql(`alter table "session" add constraint "session_userId_foreign" foreign key ("userId") references "user" ("id") on delete cascade;`);

    this.addSql(`alter table "notice_read" add constraint "notice_read_user_foreign" foreign key ("user") references "user" ("id") on delete cascade;`);
    this.addSql(`alter table "notice_read" add constraint "notice_read_notice_foreign" foreign key ("notice") references "notice" ("id") on delete cascade;`);

    this.addSql(`alter table "inquiry" add constraint "inquiry_user_foreign" foreign key ("user") references "user" ("id") on delete cascade;`);
    this.addSql(`alter table "inquiry" add constraint "inquiry_assignee_foreign" foreign key ("assignee") references "user" ("id") on delete set null;`);

    this.addSql(`alter table "inquiry_message" add constraint "inquiry_message_inquiry_foreign" foreign key ("inquiry") references "inquiry" ("id") on delete cascade;`);
    this.addSql(`alter table "inquiry_message" add constraint "inquiry_message_author_foreign" foreign key ("author") references "user" ("id") on delete cascade;`);

    this.addSql(`alter table "alert" add constraint "alert_user_foreign" foreign key ("user") references "user" ("id") on delete cascade;`);

    this.addSql(`alter table "account" add constraint "account_user_foreign" foreign key ("user") references "user" ("id") on delete cascade;`);

    this.addSql(`alter table "user_identity" add constraint "user_identity_user_foreign" foreign key ("user") references "user" ("id") on delete cascade;`);

    this.addSql(`alter table "user_term_agreement" add constraint "user_term_agreement_user_foreign" foreign key ("user") references "user" ("id") on delete cascade;`);
    this.addSql(`alter table "user_term_agreement" add constraint "user_term_agreement_term_foreign" foreign key ("term") references "term" ("id") on delete cascade;`);
  }
}
