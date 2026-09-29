import { Migration } from '@mikro-orm/migrations';

// eslint-disable-next-line sonarjs/class-name
export class Migration20260926160000_add_system_config extends Migration {
  override up(): void {
    this.addSql(`create table "system_config" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "code" varchar(100) not null, "value" jsonb not null, "description" varchar(255) null, primary key ("id"));`);
    this.addSql(`alter table "system_config" add constraint "system_config_code_unique" unique ("code");`);
    this.addSql(`insert into "system_config" ("id", "createdAt", "updatedAt", "code", "value", "description") values ('00000000-0000-4000-8000-000000000001', now(), now(), 'account-recovery-email', '{"enabled": false, "smtpHost": "", "smtpPort": 587, "smtpSecure": false, "smtpUser": "", "smtpPassword": "", "from": ""}'::jsonb, 'Admin 계정 복구 이메일 발송 설정');`);
  }

  override down(): void {
    this.addSql(`drop table "system_config";`);
  }
}
