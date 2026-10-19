import { Migration } from '@mikro-orm/migrations';

export class Migration20261014010000 extends Migration {
  override up(): void {
    this.addSql('delete from "system_config" where "code" = \'webhook\';');
    this.addSql('delete from "system_config" where "code" = \'delivery\';');
    this.addSql('alter table "system_config" drop constraint "system_config_code_check";');
    this.addSql('alter table "system_config" add constraint "system_config_code_check" check ("code" in (\'operation\', \'maintenance\', \'inquiry\', \'notification\', \'oauth\'));');
  }

  override down(): void {
    this.addSql('alter table "system_config" drop constraint "system_config_code_check";');
    this.addSql('alter table "system_config" add constraint "system_config_code_check" check ("code" in (\'operation\', \'maintenance\', \'inquiry\', \'webhook\', \'notification\', \'oauth\'));');
    this.addSql('insert into "system_config" ("id", "createdAt", "updatedAt", "code", "value", "description") values (gen_random_uuid()::text, now(), now(), \'webhook\', \'{"enabled":false,"type":"SLACK","cooldownMinutes":10,"webhookUrl":""}\'::jsonb, \'문의 운영자 알림 웹훅 설정\');');
  }
}
