import { Migration } from '@mikro-orm/migrations';

export class Migration20260811150000RenameRoleColumnToName extends Migration {
  override async up(): Promise<void> {
    const columns = await this.execute('pragma table_info(`role`);');
    const hasRoleColumn = columns.some((column) => column.name === 'role');
    const hasNameColumn = columns.some((column) => column.name === 'name');

    if (hasRoleColumn && !hasNameColumn) {
      this.addSql('alter table `role` rename column `role` to `name`;');
      this.addSql('drop index if exists `role_role_unique`;');
      this.addSql('create unique index if not exists `role_name_unique` on `role` (`name`);');
    }
  }

  override async down(): Promise<void> {
    const columns = await this.execute('pragma table_info(`role`);');
    const hasRoleColumn = columns.some((column) => column.name === 'role');
    const hasNameColumn = columns.some((column) => column.name === 'name');

    if (hasNameColumn && !hasRoleColumn) {
      this.addSql('drop index if exists `role_name_unique`;');
      this.addSql('alter table `role` rename column `name` to `role`;');
      this.addSql('create unique index if not exists `role_role_unique` on `role` (`role`);');
    }
  }
}
