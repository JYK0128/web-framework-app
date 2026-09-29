import { Migration } from '@mikro-orm/migrations';

// eslint-disable-next-line sonarjs/class-name
export class Migration20260929110000_add_inquiry_offline_reply extends Migration {
  override async up(): Promise<void> {
    this.addSql(`update "system_config" set "value" = jsonb_set("value", '{offlineReplyMessage}', to_jsonb('현재 고객지원 운영시간이 아니어서 답변이 어렵습니다. 운영시간에 확인 후 답변드리겠습니다.'::text), true) where "code" = 'inquiry' and not ("value" ? 'offlineReplyMessage');`);
    this.addSql(`update "system_config" set "description" = '고객지원 첫 안내·부재중 응답 문구, 미응답 문의 감지 및 자동 종료 시간 설정' where "code" = 'inquiry';`);
  }

  override async down(): Promise<void> {
    this.addSql(`update "system_config" set "value" = "value" - 'offlineReplyMessage' where "code" = 'inquiry';`);
    this.addSql(`update "system_config" set "description" = '고객지원 첫 안내 문구, 미응답 문의 감지 및 자동 종료 시간 설정' where "code" = 'inquiry';`);
  }
}
