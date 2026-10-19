import { Migration } from '@mikro-orm/migrations';

export class Migration20261002040000 extends Migration {
  override up(): void {
    this.addSql('alter table "system_config" drop constraint "system_config_code_check";');
    this.addSql(`alter table "system_config" add constraint "system_config_code_check" check ("code" in ('email', 'webhook', 'oauth'));`);
  }

  override down(): void {
    this.addSql(`delete from "system_config" where "code" = 'oauth';`);
    this.addSql('alter table "system_config" drop constraint "system_config_code_check";');
    this.addSql(`alter table "system_config" add constraint "system_config_code_check" check ("code" in ('email', 'webhook'));`);
  }
}
