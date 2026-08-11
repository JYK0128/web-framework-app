import { Migration } from '@mikro-orm/migrations';

export class Migration20260811120000AddUserRoleField extends Migration {
  override async up(): Promise<void> {
    const columns = await this.execute('pragma table_info(`user`);');
    const hasRoleColumn = columns.some((column) => column.name === 'role');

    if (!hasRoleColumn) {
      this.addSql('alter table `user` add column `role` text not null default \'user\';');
    }

    this.addSql(`
      update "user"
      set "role" = case
        when "isAnonymous" = 1 then 'anonymous'
        else 'user'
      end
      where "role" is null or "role" = '' or "role" = 'admin';
    `);
    this.addSql(`
      update "user"
      set "metadata" = json_remove(
        json_remove(coalesce("metadata", '{}'), '$.isAdmin'),
        '$.role'
      )
      where "metadata" is not null;
    `);
    this.addSql('delete from "role" where "role" = \'admin\';');
  }

  override async down(): Promise<void> {
    this.addSql('alter table `user` drop column `role`;');
  }
}
