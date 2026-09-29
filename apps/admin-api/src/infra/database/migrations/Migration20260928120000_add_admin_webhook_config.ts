import { Migration } from '@mikro-orm/migrations';

// eslint-disable-next-line sonarjs/class-name
export class Migration20260928120000_add_admin_webhook_config extends Migration {
  override up(): void {
    this.addSql('alter table "system_config" drop constraint "system_config_code_check";');
    this.addSql('alter table "system_config" add constraint "system_config_code_check" check ("code" in (\'email\', \'webhook\'));');
  }

  override down(): void {
    this.addSql('delete from "system_config" where "code" = \'webhook\';');
    this.addSql('alter table "system_config" drop constraint "system_config_code_check";');
    this.addSql('alter table "system_config" add constraint "system_config_code_check" check ("code" in (\'email\'));');
  }
}
