import { Migration } from '@mikro-orm/migrations';

export class Migration20260905231600 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`alter table "system_config" drop constraint "system_config_category_check";`);
    this.addSql(`alter table "system_config" add constraint "system_config_category_check" check ("category" in ('OPERATION', 'MAINTENANCE', 'SECURITY', 'INQUIRY', 'NOTIFICATION'));`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "system_config" drop constraint "system_config_category_check";`);
    this.addSql(`alter table "system_config" add constraint "system_config_category_check" check ("category" in ('OPERATION', 'MAINTENANCE', 'AUTH', 'NOTIFICATION', 'INQUIRY'));`);
  }
}
