import { Migration } from '@mikro-orm/migrations';

// eslint-disable-next-line sonarjs/class-name
export class Migration20261002000000_initial extends Migration {
  override up(): void {
    this.addSql('create table "faq" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "category" text not null, "question" varchar(255) not null, "answer" text not null, "sortOrder" int not null default 0, "isPublished" boolean not null default true, primary key ("id"));');
    this.addSql('alter table "faq" add constraint "faq_category_check" check ("category" in (\'계정\', \'서비스 이용\', \'검증\'));');
    this.addSql('create table "log_entry" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "level" text not null default \'info\', "method" varchar(20) not null, "path" varchar(500) not null, "statusCode" int not null, "durationMs" int not null, "requestId" varchar(255) null, "ipAddress" varchar(255) null, "userAgent" varchar(500) null, "errorMessage" varchar(255) null, primary key ("id"));');
    this.addSql('create index "log_entry_level_index" on "log_entry" ("level");');
    this.addSql('create index "log_entry_method_index" on "log_entry" ("method");');
    this.addSql('create index "log_entry_path_index" on "log_entry" ("path");');
    this.addSql('create index "log_entry_statusCode_index" on "log_entry" ("statusCode");');
    this.addSql('create index "log_entry_requestId_index" on "log_entry" ("requestId");');
    this.addSql('alter table "log_entry" add constraint "log_entry_level_check" check ("level" in (\'info\', \'warn\', \'error\'));');
    this.addSql('create table "permission" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "code" varchar(120) not null, "label" varchar(100) not null, "description" varchar(255) null, primary key ("id"));');
    this.addSql('alter table "permission" add constraint "permission_code_unique" unique ("code");');
    this.addSql('create table "role" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "code" varchar(50) not null, "label" varchar(100) null, "description" varchar(255) null, "isSystem" boolean not null default false, "permissions" text[] not null default \'{}\', primary key ("id"));');
    this.addSql('alter table "role" add constraint "role_code_unique" unique ("code");');
    this.addSql('create table "system_config" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "code" text not null, "value" jsonb not null, "description" varchar(255) null, primary key ("id"));');
    this.addSql('create index "system_config_code_index" on "system_config" ("code");');
    this.addSql('alter table "system_config" add constraint "system_config_code_unique" unique ("code");');
    this.addSql('alter table "system_config" add constraint "system_config_code_check" check ("code" in (\'operation\', \'maintenance\', \'inquiry\', \'webhook\', \'delivery\', \'oauth\'));');
    this.addSql('create table "term_group" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "title" varchar(255) not null, "isRequired" boolean not null default false, "sortOrder" int not null default 0, primary key ("id"));');
    this.addSql('create table "term" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "termGroup" varchar(255) not null, "version" varchar(50) not null, "content" text not null, "reason" text not null, "summary" text not null, "isNoticeRequired" boolean not null default false, "publishedAt" timestamptz null, primary key ("id"));');
    this.addSql('create table "upload" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "originalName" varchar(255) not null, "storedName" varchar(255) not null, "mimeType" varchar(100) not null, "size" int not null default 0, "subDir" varchar(100) not null, "url" varchar(500) not null, "status" text not null default \'pending\', primary key ("id"));');
    this.addSql('create index "upload_storedName_index" on "upload" ("storedName");');
    this.addSql('create index "upload_subDir_index" on "upload" ("subDir");');
    this.addSql('create index "upload_status_index" on "upload" ("status");');
    this.addSql('alter table "upload" add constraint "upload_status_check" check ("status" in (\'pending\', \'ready\', \'failed\'));');
    this.addSql('create table "user" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "name" varchar(120) not null, "emailEncrypted" text not null, "emailHash" varchar(64) not null, "emailVerified" boolean not null default false, "phoneNumberVerified" boolean not null default false, "image" varchar(255) null, "twoFactorEnabled" boolean not null default false, "banned" boolean not null default false, "banReason" varchar(255) null, "banExpires" timestamptz null, "role" varchar(255) null, primary key ("id"));');
    this.addSql('alter table "user" add constraint "user_emailHash_unique" unique ("emailHash");');
    this.addSql('create table "twoFactor" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "secret" varchar(255) not null, "backupCodes" varchar(255) null, "verified" boolean not null default false, "failedVerificationCount" int not null default 0, "lockedUntil" timestamptz null, "user" varchar(255) not null, primary key ("id"));');
    this.addSql('create table "support_room" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "user_id" varchar(255) not null, "assignee_id" varchar(255) null, "title" varchar(255) not null, "status" varchar(20) not null default \'open\', "lastMessageAt" timestamptz null, primary key ("id"));');
    this.addSql('create table "support_message" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "room_id" varchar(255) not null, "sender_user_id" varchar(255) null, "senderType" varchar(20) not null, "content" text not null, "readAt" timestamptz null, primary key ("id"));');
    this.addSql('create table "session" ("id" varchar(255) not null, "userId" varchar(255) not null, "token" varchar(255) not null, "expiresAt" timestamptz not null, "ipAddress" varchar(255) null, "userAgent" text null, "createdAt" timestamptz not null, "updatedAt" timestamptz not null, primary key ("id"));');
    this.addSql('alter table "session" add constraint "session_token_unique" unique ("token");');
    this.addSql('create table "refresh_token" ("id" varchar(255) not null, "userId" varchar(255) not null, "tokenHash" varchar(64) not null, "familyId" varchar(255) not null, "rememberMe" boolean not null, "expiresAt" timestamptz not null, "idleExpiresAt" timestamptz not null, "usedAt" timestamptz null, "revokedAt" timestamptz null, "createdAt" timestamptz not null, primary key ("id"));');
    this.addSql('alter table "refresh_token" add constraint "refresh_token_tokenHash_unique" unique ("tokenHash");');
    this.addSql('create table "qna" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "user_id" varchar(255) not null, "assignee_id" varchar(255) null, "category" text not null, "title" varchar(255) not null, "content" text not null, "priority" varchar(20) not null default \'normal\', "status" varchar(20) not null default \'open\', "answer" text null, primary key ("id"));');
    this.addSql('alter table "qna" add constraint "qna_category_check" check ("category" in (\'계정\', \'서비스 이용\', \'검증\'));');
    this.addSql('create table "profile" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "user" varchar(255) not null, "employeeNo" varchar(50) null, "department" varchar(100) null, "phoneNumberEncrypted" text null, "phoneNumberHash" varchar(64) null, "identityCiHash" varchar(64) null, "identityDiHash" varchar(64) null, primary key ("id"));');
    this.addSql('alter table "profile" add constraint "profile_user_unique" unique ("user");');
    this.addSql('alter table "profile" add constraint "profile_employeeNo_unique" unique ("employeeNo");');
    this.addSql('alter table "profile" add constraint "profile_phoneNumberHash_unique" unique ("phoneNumberHash");');
    this.addSql('alter table "profile" add constraint "profile_identityCiHash_unique" unique ("identityCiHash");');
    this.addSql('alter table "profile" add constraint "profile_identityDiHash_unique" unique ("identityDiHash");');
    this.addSql('create table "account" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "user" varchar(255) not null, "accountId" varchar(255) not null, "providerId" varchar(255) not null, "accessToken" text null, "refreshToken" text null, "accessTokenExpiresAt" timestamptz null, "refreshTokenExpiresAt" timestamptz null, "scope" text null, "idToken" text null, "password" text null, "metadata" jsonb null, primary key ("id"));');
    this.addSql('create table "user_term_agreement" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "user" varchar(255) not null, "term" varchar(255) not null, "isAgreed" boolean not null, primary key ("id"));');
    this.addSql('alter table "term" add constraint "term_termGroup_foreign" foreign key ("termGroup") references "term_group" ("id") on delete cascade;');
    this.addSql('alter table "user" add constraint "user_role_foreign" foreign key ("role") references "role" ("id") on delete set null;');
    this.addSql('alter table "twoFactor" add constraint "twoFactor_user_foreign" foreign key ("user") references "user" ("id") on delete cascade;');
    this.addSql('alter table "support_room" add constraint "support_room_user_id_foreign" foreign key ("user_id") references "user" ("id") on delete cascade;');
    this.addSql('alter table "support_room" add constraint "support_room_assignee_id_foreign" foreign key ("assignee_id") references "user" ("id") on delete set null;');
    this.addSql('alter table "support_message" add constraint "support_message_room_id_foreign" foreign key ("room_id") references "support_room" ("id") on delete cascade;');
    this.addSql('alter table "support_message" add constraint "support_message_sender_user_id_foreign" foreign key ("sender_user_id") references "user" ("id") on delete set null;');
    this.addSql('alter table "session" add constraint "session_userId_foreign" foreign key ("userId") references "user" ("id") on delete cascade;');
    this.addSql('alter table "refresh_token" add constraint "refresh_token_userId_foreign" foreign key ("userId") references "user" ("id") on delete cascade;');
    this.addSql('alter table "qna" add constraint "qna_user_id_foreign" foreign key ("user_id") references "user" ("id") on delete cascade;');
    this.addSql('alter table "qna" add constraint "qna_assignee_id_foreign" foreign key ("assignee_id") references "user" ("id") on delete set null;');
    this.addSql('alter table "profile" add constraint "profile_user_foreign" foreign key ("user") references "user" ("id");');
    this.addSql('alter table "account" add constraint "account_user_foreign" foreign key ("user") references "user" ("id") on delete cascade;');
    this.addSql('alter table "user_term_agreement" add constraint "user_term_agreement_user_foreign" foreign key ("user") references "user" ("id") on delete cascade;');
    this.addSql('alter table "user_term_agreement" add constraint "user_term_agreement_term_foreign" foreign key ("term") references "term" ("id") on delete cascade;');
  }

  override down(): void {
    this.addSql('drop table if exists "user_term_agreement" cascade;');
    this.addSql('drop table if exists "account" cascade;');
    this.addSql('drop table if exists "profile" cascade;');
    this.addSql('drop table if exists "qna" cascade;');
    this.addSql('drop table if exists "refresh_token" cascade;');
    this.addSql('drop table if exists "session" cascade;');
    this.addSql('drop table if exists "support_message" cascade;');
    this.addSql('drop table if exists "support_room" cascade;');
    this.addSql('drop table if exists "twoFactor" cascade;');
    this.addSql('drop table if exists "user" cascade;');
    this.addSql('drop table if exists "upload" cascade;');
    this.addSql('drop table if exists "term" cascade;');
    this.addSql('drop table if exists "term_group" cascade;');
    this.addSql('drop table if exists "system_config" cascade;');
    this.addSql('drop table if exists "role" cascade;');
    this.addSql('drop table if exists "permission" cascade;');
    this.addSql('drop table if exists "log_entry" cascade;');
    this.addSql('drop table if exists "faq" cascade;');
  }
}
