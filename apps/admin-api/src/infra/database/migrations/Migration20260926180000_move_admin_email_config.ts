import { Migration } from '@mikro-orm/migrations';

// eslint-disable-next-line sonarjs/class-name
export class Migration20260926180000_move_admin_email_config extends Migration {
  override up(): void {
    this.addSql(`update "system_config" set "code" = 'email', "value" = jsonb_build_object('from', "value" #> '{accountRecoveryEmail,from}', 'smtp', jsonb_build_object('host', "value" #> '{accountRecoveryEmail,smtpHost}', 'port', "value" #> '{accountRecoveryEmail,smtpPort}', 'secure', "value" #> '{accountRecoveryEmail,smtpSecure}', 'user', "value" #> '{accountRecoveryEmail,smtpUser}', 'pass', "value" #> '{accountRecoveryEmail,smtpPassword}')), "description" = 'Admin 이메일 발송 설정' where "code" = 'auth';`);
  }

  override down(): void {
    this.addSql(`update "system_config" set "code" = 'auth', "value" = jsonb_build_object('accountRecoveryEmail', jsonb_build_object('enabled', false, 'from', "value" -> 'from', 'smtpHost', "value" #> '{smtp,host}', 'smtpPort', "value" #> '{smtp,port}', 'smtpSecure', "value" #> '{smtp,secure}', 'smtpUser', "value" #> '{smtp,user}', 'smtpPassword', "value" #> '{smtp,pass}')), "description" = 'Admin 인증 및 계정 복구 설정' where "code" = 'email';`);
  }
}
