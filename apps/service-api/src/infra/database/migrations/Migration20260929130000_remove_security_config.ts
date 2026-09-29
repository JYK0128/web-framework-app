import { Migration } from '@mikro-orm/migrations';

// eslint-disable-next-line sonarjs/class-name
export class Migration20260929130000_remove_security_config extends Migration {
  override up(): void {
    this.addSql(`delete from "system_config" where "code" = 'security';`);
    this.addSql(`alter table "system_config" drop constraint "system_config_code_check";`);
    this.addSql(`alter table "system_config" add constraint "system_config_code_check" check ("code" in ('operation', 'maintenance', 'inquiry', 'webhook', 'delivery', 'oauth'));`);
  }

  override down(): void {
    this.addSql(`alter table "system_config" drop constraint "system_config_code_check";`);
    this.addSql(`alter table "system_config" add constraint "system_config_code_check" check ("code" in ('operation', 'maintenance', 'security', 'inquiry', 'webhook', 'delivery', 'oauth'));`);
    this.addSql(`insert into "system_config" ("id", "createdAt", "updatedAt", "code", "value", "description") values (gen_random_uuid()::text, now(), now(), 'security', '{"registration":{"allowRegistration":true,"allowCredentialRegistration":true,"requireEmailVerification":true},"session":{"preventConcurrentLogin":false,"timeoutMinutes":30,"rememberMeDays":30},"lockout":{"maxFailureAttempts":5,"lockoutDurationMinutes":15},"password":{"minLength":8,"maxBytes":256,"requireSpecialChar":true,"requireNumbers":true,"requireUppercase":false,"expirationDays":90,"changeDeferDays":30,"historyLimit":3},"twoFactor":{"allowUser2FA":true}}'::jsonb, '서비스 보안 정책 (config.ts 관리)');`);
  }
}
