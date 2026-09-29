import { Migration } from '@mikro-orm/migrations';

// eslint-disable-next-line sonarjs/class-name
export class Migration20260927100000_separate_webhook_and_rename_delivery_config extends Migration {
  override up(): void {
    this.addSql(`alter table "system_config" drop constraint "system_config_code_check";`);
    this.addSql(`update "system_config" set "code" = 'delivery' where "code" = 'notification';`);
    this.addSql(`alter table "system_config" add constraint "system_config_code_check" check ("code" in ('operation', 'maintenance', 'security', 'inquiry', 'webhook', 'delivery', 'oauth'));`);
    this.addSql(`insert into "system_config" ("id", "createdAt", "updatedAt", "code", "value", "description") select gen_random_uuid()::text, now(), now(), 'webhook', coalesce("value" -> 'webhook', "value" -> 'notification', '{"enabled":false,"type":"SLACK","cooldownMinutes":10,"webhookUrl":""}'::jsonb), '문의 운영자 알림 웹훅 설정' from "system_config" where "code" = 'inquiry' on conflict ("code") do nothing;`);
    this.addSql(`update "system_config" set "value" = "value" - 'webhook' - 'notification', "description" = '미응답 문의 감지 및 답변 완료 후 자동 종료 시간 설정' where "code" = 'inquiry';`);
  }

  override down(): void {
    this.addSql(`update "system_config" as inquiry set "value" = jsonb_set(inquiry."value", '{notification}', webhook."value", true), "description" = '미응답 문의 감지, 답변 완료 후 자동 종료 시간 및 운영자 알림 웹훅 설정' from "system_config" as webhook where inquiry."code" = 'inquiry' and webhook."code" = 'webhook';`);
    this.addSql(`delete from "system_config" where "code" = 'webhook';`);
    this.addSql(`alter table "system_config" drop constraint "system_config_code_check";`);
    this.addSql(`update "system_config" set "code" = 'notification' where "code" = 'delivery';`);
    this.addSql(`alter table "system_config" add constraint "system_config_code_check" check ("code" in ('operation', 'maintenance', 'security', 'inquiry', 'notification', 'oauth'));`);
  }
}
