import { Migration } from '@mikro-orm/migrations';

export class Migration20260907000911 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`alter table "system_config" drop constraint "system_config_category_check";`);
    this.addSql(`alter table "system_config" alter column "key" type text using ("key"::text);`);
    this.addSql(`alter table "system_config" add constraint "system_config_key_check" check ("key" in ('operation', 'maintenance', 'security', 'inquiry', 'notification', 'oauth'));`);
    this.addSql(`alter table "system_config" add constraint "system_config_category_check" check ("category" in ('OPERATION', 'MAINTENANCE', 'SECURITY', 'INQUIRY', 'NOTIFICATION', 'OAUTH'));`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "system_config" drop constraint "system_config_key_check";`);
    this.addSql(`alter table "system_config" drop constraint "system_config_category_check";`);
    this.addSql(`alter table "system_config" alter column "key" type varchar(100) using ("key"::varchar(100));`);
    this.addSql(`alter table "system_config" add constraint "system_config_category_check" check ("category" in ('OPERATION', 'MAINTENANCE', 'SECURITY', 'INQUIRY', 'NOTIFICATION'));`);
  }
}
