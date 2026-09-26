import { Migration } from '@mikro-orm/migrations';

// eslint-disable-next-line sonarjs/class-name
export class Migration20260926190000_remove_admin_email_enabled extends Migration {
  override up(): void {
    this.addSql(`update "system_config" set "value" = "value" - 'enabled' where "code" = 'email';`);
  }

  override down(): void {
    this.addSql(`update "system_config" set "value" = jsonb_set("value", '{enabled}', 'false'::jsonb, true) where "code" = 'email';`);
  }
}
