import { Migration } from '@mikro-orm/migrations';

// eslint-disable-next-line sonarjs/class-name
export class Migration20260926140000_remove_system_config_is_public extends Migration {
  override up(): void {
    this.addSql(`alter table "system_config" drop column "isPublic";`);
  }

  override down(): void {
    this.addSql(`alter table "system_config" add column "isPublic" boolean not null default false;`);
  }
}
