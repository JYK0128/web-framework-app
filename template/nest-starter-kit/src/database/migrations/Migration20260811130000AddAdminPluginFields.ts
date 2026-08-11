import { Migration } from '@mikro-orm/migrations';

export class Migration20260811130000AddAdminPluginFields extends Migration {
  override async up(): Promise<void> {
    const userColumns = await this.execute('pragma table_info(`user`);');
    if (!userColumns.some((column) => column.name === 'role')) {
      this.addSql('alter table `user` add column `role` text not null default \'user\';');
    }
    if (!userColumns.some((column) => column.name === 'banned')) {
      this.addSql('alter table `user` add column `banned` integer not null default false;');
    }
    if (!userColumns.some((column) => column.name === 'banReason')) {
      this.addSql('alter table `user` add column `banReason` text null;');
    }
    if (!userColumns.some((column) => column.name === 'banExpires')) {
      this.addSql('alter table `user` add column `banExpires` datetime null;');
    }

    this.addSql(`
      update "user"
      set "role" = case
        when "isAnonymous" = 1 then 'anonymous'
        else 'user'
      end;
    `);

    const sessionColumns = await this.execute('pragma table_info(`session`);');
    if (!sessionColumns.some((column) => column.name === 'impersonatedBy')) {
      this.addSql('alter table `session` add column `impersonatedBy` text null;');
    }
  }

  override down(): void | Promise<void> {
    this.addSql('alter table `session` drop column `impersonatedBy`;');
    this.addSql('alter table `user` drop column `banExpires`;');
    this.addSql('alter table `user` drop column `banReason`;');
    this.addSql('alter table `user` drop column `banned`;');
    this.addSql('alter table `user` drop column `role`;');
  }
}
