import { Migration } from '@mikro-orm/migrations';

// eslint-disable-next-line sonarjs/class-name
export class Migration20260926170000_categorize_system_config extends Migration {
  override up(): void {
    this.addSql(`update "system_config" set "code" = 'auth', "value" = jsonb_build_object('accountRecoveryEmail', "value"), "description" = 'Admin 인증 및 계정 복구 설정' where "code" = 'account-recovery-email';`);
  }

  override down(): void {
    this.addSql(`update "system_config" set "code" = 'account-recovery-email', "value" = "value" -> 'accountRecoveryEmail', "description" = 'Admin 계정 복구 이메일 발송 설정' where "code" = 'auth';`);
  }
}
