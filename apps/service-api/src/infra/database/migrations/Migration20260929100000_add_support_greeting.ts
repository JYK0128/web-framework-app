import { Migration } from '@mikro-orm/migrations';

// eslint-disable-next-line sonarjs/class-name
export class Migration20260929100000_add_support_greeting extends Migration {
  override async up(): Promise<void> {
    this.addSql(`update "system_config" set "value" = jsonb_set("value", '{customerGreeting}', to_jsonb(E'안녕하세요! 무엇을 도와 드릴까요?\\n궁금한 내용을 남겨 주시면 상담원이 확인해 드리겠습니다.'::text), true) where "code" = 'inquiry' and not ("value" ? 'customerGreeting');`);
    this.addSql(`update "system_config" set "description" = '고객지원 첫 문구, 미응답 문의 감지 및 답변 완료 후 자동 종료 시간 설정' where "code" = 'inquiry';`);
  }

  override async down(): Promise<void> {
    this.addSql(`update "system_config" set "value" = "value" - 'customerGreeting' where "code" = 'inquiry';`);
    this.addSql(`update "system_config" set "description" = '미응답 문의 감지 및 답변 완료 후 자동 종료 시간 설정' where "code" = 'inquiry';`);
  }
}
