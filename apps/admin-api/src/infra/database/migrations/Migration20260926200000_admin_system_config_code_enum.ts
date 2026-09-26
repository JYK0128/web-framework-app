import { Migration } from '@mikro-orm/migrations';

// eslint-disable-next-line sonarjs/class-name
export class Migration20260926200000_admin_system_config_code_enum extends Migration {
  override up(): void {
    this.addSql('alter table "system_config" add constraint "system_config_code_check" check ("code" in (\'email\'));');
  }

  override down(): void {
    this.addSql('alter table "system_config" drop constraint "system_config_code_check";');
  }
}
