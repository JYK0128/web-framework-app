import { Migration } from '@mikro-orm/migrations';

export class Migration20260811120000MigrateAdminRoles extends Migration {
  override async up(): Promise<void> {
    const columns = await this.execute('pragma table_info(`user`);');
    if (!columns.some((column) => column.name === 'role')) {
      this.addSql('alter table `user` add column `role` text null;');
    }
    this.addSql(`
      update "user"
      set "role" = case
        when "isAnonymous" = 1 then 'anonymous'
        else 'admin'
      end
      where "role" is null;
    `);
    this.addSql(`
      update "user"
      set "metadata" = json_remove(
        json_remove(coalesce("metadata", '{}'), '$.isAdmin'),
        '$.role'
      )
      where "metadata" is not null;
    `);
    this.addSql('delete from "role" where "role" = \'user\';');
  }

  override down(): void | Promise<void> {}
}
