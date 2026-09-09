import { Migration } from '@mikro-orm/migrations';

export class Migration20260904115006 extends Migration {
  override up(): void | Promise<void> {
    // --- merged from Migration20260823031240 ---
    this.addSql(`create table "faq" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "category" varchar(50) not null, "question" varchar(255) not null, "answer" text not null, "order" int not null default 0, "isPublished" boolean not null default true, "helpfulCount" int not null default 0, primary key ("id"));`);

    this.addSql(`create table "notice" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "title" varchar(255) not null, "content" text not null, "priority" int not null default 0, "publishedAt" timestamptz null, "expiresAt" timestamptz null, primary key ("id"));`);

    this.addSql(`create table "role" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "name" varchar(30) not null, "permissions" jsonb not null, primary key ("id"));`);
    this.addSql(`alter table "role" add constraint "role_name_unique" unique ("name");`);

    this.addSql(`create table "system_config" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "key" varchar(100) not null, "category" text not null, "value" jsonb not null, "isPublic" boolean not null default false, "description" varchar(255) null, primary key ("id"));`);
    this.addSql(`create index "system_config_key_index" on "system_config" ("key");`);
    this.addSql(`alter table "system_config" add constraint "system_config_key_unique" unique ("key");`);
    this.addSql(`create index "system_config_category_index" on "system_config" ("category");`);
    this.addSql(`alter table "system_config" add constraint "system_config_category_check" check ("category" in ('OPERATION', 'MAINTENANCE', 'AUTH', 'NOTIFICATION', 'INQUIRY'));`);

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
    // --- merged from Migration20260823234046 ---
    this.addSql(`create table "message_template" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "code" varchar(100) not null, "locale" varchar(10) not null default 'ko', "channel" varchar(30) not null, "name" varchar(100) not null, "title" varchar(255) null, "body" text not null, "variables" jsonb not null, "description" text null, "isActive" boolean not null default true, primary key ("id"));`);
    this.addSql(`alter table "message_template" add constraint "message_template_code_locale_unique" unique ("code", "locale");`);
    // --- merged from Migration20260825000000 ---
    this.addSql(`alter table "faq" drop column if exists "helpfulCount";`);
    // --- merged from Migration20260826000000 ---
    this.addSql(`
      update "system_config" as scheduled
      set
        "key" = 'maintenance',
        "value" = jsonb_build_object(
          'enabled',
            coalesce((emergency."value"->>'enabled')::boolean, false)
            or coalesce((scheduled."value"->>'enabled')::boolean, false),
          'message', coalesce(emergency."value"->>'message', '시스템 점검 중입니다.'),
          'scheduledStartAt', scheduled."value"->'scheduledStartAt',
          'scheduledEndAt', scheduled."value"->'scheduledEndAt'
        ),
        "description" = '시스템 점검 활성화, 안내 문구 및 예약 스케줄 설정'
      from "system_config" as emergency
      where scheduled."key" = 'maintenance.scheduled'
        and emergency."key" = 'maintenance.emergency'
        and not exists (
          select 1 from "system_config" where "key" = 'maintenance'
        );
    `);

    this.addSql(`
      update "system_config"
      set
        "key" = 'maintenance',
        "value" = jsonb_build_object(
          'enabled', coalesce(("value"->>'enabled')::boolean, false),
          'message', coalesce("value"->>'message', '시스템 점검 중입니다.'),
          'scheduledStartAt', null,
          'scheduledEndAt', null
        ),
        "description" = '시스템 점검 활성화, 안내 문구 및 예약 스케줄 설정'
      where "key" = 'maintenance.emergency'
        and not exists (
          select 1 from "system_config" where "key" = 'maintenance'
        );
    `);

    this.addSql(`
      update "system_config"
      set
        "key" = 'maintenance',
        "value" = jsonb_build_object(
          'enabled', coalesce(("value"->>'enabled')::boolean, false),
          'message', '시스템 점검 중입니다.',
          'scheduledStartAt', "value"->'scheduledStartAt',
          'scheduledEndAt', "value"->'scheduledEndAt'
        ),
        "description" = '시스템 점검 활성화, 안내 문구 및 예약 스케줄 설정'
      where "key" = 'maintenance.scheduled'
        and not exists (
          select 1 from "system_config" where "key" = 'maintenance'
        );
    `);

    this.addSql(`delete from "system_config" where "key" in ('maintenance.emergency', 'maintenance.scheduled');`);
    // --- merged from Migration20260826010000 ---
    this.addSql(`
      alter table "notice"
        alter column "priority" drop default,
        alter column "priority" type varchar(10)
          using case "priority"
            when 0 then 'LOW'
            when 1 then 'NORMAL'
            when 2 then 'HIGH'
            else 'LOW'
          end,
        alter column "priority" set default 'LOW';
    `);
    // --- merged from Migration20260827000000 ---
    this.addSql(`
      insert into "alert" (
        "id",
        "createdAt",
        "updatedAt",
        "metadata",
        "user",
        "type",
        "title",
        "content",
        "linkUrl",
        "isRead"
      )
      select
        md5(random()::text || clock_timestamp()::text || notice."id" || app_user."id"),
        now(),
        now(),
        jsonb_build_object('source', 'notice-backfill', 'noticeId', notice."id"),
        app_user."id",
        'notice',
        '📢 새 공지사항',
        notice."title",
        '/notice',
        false
      from "notice" as notice
      cross join "user" as app_user
      where notice."deletedAt" is null
        and notice."publishedAt" is not null
        and notice."publishedAt" <= now()
        and (notice."expiresAt" is null or notice."expiresAt" > now())
        and app_user."deletedAt" is null
        and (app_user."banExpires" is null or app_user."banExpires" <= now())
        and not exists (
          select 1
          from "alert" as existing_alert
          where existing_alert."metadata"->>'source' = 'notice-backfill'
            and existing_alert."metadata"->>'noticeId' = notice."id"
            and existing_alert."user" = app_user."id"
        );
    `);
    // --- merged from Migration20260827010000 ---
    this.addSql(`
      update "alert"
      set "linkUrl" = '/notice?noticeId=' || ("metadata"->>'noticeId')
      where "metadata"->>'source' = 'notice-backfill'
        and "metadata"->>'noticeId' is not null;
    `);
    // --- merged from Migration20260828000000 ---
    this.addSql(`
      delete from "message_template" as duplicate
      where exists (
        select 1
        from "message_template" as preferred
        where preferred."code" = duplicate."code"
          and preferred."id" <> duplicate."id"
          and (
            (
              duplicate."locale" <> 'ko'
              and preferred."locale" = 'ko'
            )
            or (
              not exists (
                select 1
                from "message_template" as korean
                where korean."code" = duplicate."code"
                  and korean."locale" = 'ko'
              )
              and preferred."id" < duplicate."id"
            )
          )
      );
    `);
    this.addSql(`alter table "message_template" drop constraint if exists "message_template_code_locale_unique";`);
    this.addSql(`alter table "message_template" drop column "locale";`);
    this.addSql(`alter table "message_template" add constraint "message_template_code_unique" unique ("code");`);
    // --- merged from Migration20260903050536 ---
    this.addSql(`alter table "role" add "label" varchar(100) null, add "description" varchar(255) null, add "isSystem" boolean not null default false;`);
    this.addSql(`alter table "role" alter column "name" type varchar(50) using ("name"::varchar(50));`);

    this.addSql(`alter table "user" alter column "role" type varchar(50) using ("role"::varchar(50));`);
    // --- merged from Migration20260903063804 ---
    this.addSql(`create table "resource" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "key" varchar(50) not null, "label" varchar(100) not null, "category" varchar(50) not null default 'general', "description" varchar(255) null, "icon" varchar(50) null, "actions" jsonb not null, "sortOrder" int not null default 0, primary key ("id"));`);
    this.addSql(`alter table "resource" add constraint "resource_key_unique" unique ("key");`);
    // --- merged from Migration20260904000000 ---
    this.addSql('alter table "resource" drop column if exists "category", drop column if exists "icon", drop column if exists "sortOrder";');
    // --- merged from Migration20260904010000 ---
    this.addSql('alter table "role" rename column "name" to "key";');
    this.addSql('alter index if exists "role_name_unique" rename to "role_key_unique";');
  }

  override down(): void | Promise<void> {
    // --- merged from Migration20260904010000 ---
    this.addSql('alter index if exists "role_key_unique" rename to "role_name_unique";');
    this.addSql('alter table "role" rename column "key" to "name";');
    // --- merged from Migration20260904000000 ---
    this.addSql('alter table "resource" add "category" varchar(50) not null default \'general\', add "icon" varchar(50) null, add "sortOrder" int not null default 0;');
    // --- merged from Migration20260903063804 ---
    this.addSql(`drop table if exists "resource" cascade;`);
    // --- merged from Migration20260903050536 ---
    this.addSql(`alter table "role" drop column "label", drop column "description", drop column "isSystem";`);
    this.addSql(`alter table "role" alter column "name" type varchar(30) using ("name"::varchar(30));`);

    this.addSql(`alter table "user" alter column "role" type varchar(30) using ("role"::varchar(30));`);
    // --- merged from Migration20260828000000 ---
    this.addSql(`alter table "message_template" drop constraint if exists "message_template_code_unique";`);
    this.addSql(`alter table "message_template" add column "locale" varchar(10) not null default 'ko';`);
    this.addSql(`alter table "message_template" add constraint "message_template_code_locale_unique" unique ("code", "locale");`);
    // --- merged from Migration20260827010000 ---
    this.addSql(`
      update "alert"
      set "linkUrl" = '/notice'
      where "metadata"->>'source' = 'notice-backfill';
    `);
    // --- merged from Migration20260827000000 ---
    this.addSql(`
      delete from "alert"
      where "metadata"->>'source' = 'notice-backfill';
    `);
    // --- merged from Migration20260826010000 ---
    this.addSql(`
      alter table "notice"
        alter column "priority" drop default,
        alter column "priority" type int
          using case "priority"
            when 'LOW' then 0
            when 'NORMAL' then 1
            when 'HIGH' then 2
            else 0
          end,
        alter column "priority" set default 0;
    `);
    // --- merged from Migration20260826000000 ---
    this.addSql(`delete from "system_config" where "key" = 'maintenance';`);
    // --- merged from Migration20260825000000 ---
    this.addSql(`alter table "faq" add column if not exists "helpfulCount" int not null default 0;`);
    // --- merged from Migration20260823234046 ---
    this.addSql(`drop table if exists "message_template" cascade;`);
  }
}
