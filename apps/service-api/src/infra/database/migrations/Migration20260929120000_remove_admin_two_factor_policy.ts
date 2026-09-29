import { Migration } from '@mikro-orm/migrations';

// eslint-disable-next-line sonarjs/class-name
export class Migration20260929120000_remove_admin_two_factor_policy extends Migration {
  override up(): void {
    this.addSql(`update "system_config" set "value" = jsonb_set("value", '{twoFactor}', ("value"->'twoFactor') - 'enforceAdmin2FA', true) where "code" = 'security' and "value"->'twoFactor' ? 'enforceAdmin2FA';`);
    this.addSql(`update "system_config" set "description" = '서비스 회원가입, 세션/로그인 보안, 계정 잠금, 비밀번호 및 2단계 인증 정책' where "code" = 'security';`);
  }

  override down(): void {
    this.addSql(`update "system_config" set "value" = jsonb_set("value", '{twoFactor,enforceAdmin2FA}', 'false'::jsonb, true) where "code" = 'security';`);
    this.addSql(`update "system_config" set "description" = '신규 회원가입, 세션/로그인 보안, 계정 잠금, 비밀번호 및 2단계 인증 정책' where "code" = 'security';`);
  }
}
