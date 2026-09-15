import { Migration } from '@mikro-orm/migrations';

/** Align the legacy support inquiry config with the current system config contract. */
export class Migration20260914180000 extends Migration {
  override up(): void {
    this.addSql('alter table "system_config" drop constraint if exists "system_config_key_check";');
    this.addSql('alter table "system_config" drop constraint if exists "system_config_category_check";');
    this.addSql(`
      update "system_config"
      set "key" = 'inquiry', "category" = 'INQUIRY'
      where "key" = 'supportInquiry' or "category" = 'SUPPORT_INQUIRY';
    `);
    this.addSql(`
      alter table "system_config"
      add constraint "system_config_key_check"
      check ("key" in ('operation', 'maintenance', 'security', 'inquiry', 'notification', 'oauth'));
    `);
    this.addSql(`
      alter table "system_config"
      add constraint "system_config_category_check"
      check ("category" in ('OPERATION', 'MAINTENANCE', 'SECURITY', 'INQUIRY', 'NOTIFICATION', 'OAUTH'));
    `);
  }

  override down(): void {
    this.addSql('alter table "system_config" drop constraint if exists "system_config_key_check";');
    this.addSql('alter table "system_config" drop constraint if exists "system_config_category_check";');
    this.addSql(`
      update "system_config"
      set "key" = 'supportInquiry', "category" = 'SUPPORT_INQUIRY'
      where "key" = 'inquiry' or "category" = 'INQUIRY';
    `);
    this.addSql(`
      alter table "system_config"
      add constraint "system_config_key_check"
      check ("key" in ('operation', 'maintenance', 'security', 'supportInquiry', 'notification', 'oauth'));
    `);
    this.addSql(`
      alter table "system_config"
      add constraint "system_config_category_check"
      check ("category" in ('OPERATION', 'MAINTENANCE', 'SECURITY', 'SUPPORT_INQUIRY', 'NOTIFICATION', 'OAUTH'));
    `);
  }
}
