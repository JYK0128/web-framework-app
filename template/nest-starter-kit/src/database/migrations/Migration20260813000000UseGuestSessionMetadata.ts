import { Migration } from '@mikro-orm/migrations';

/**
 * Guest sessions are not application users. Keep their identity in the
 * session metadata so high-traffic anonymous access does not create rows in
 * the user table.
 */
export class Migration20260813000000UseGuestSessionMetadata extends Migration {
  override async up(): Promise<void> {
    const sessionColumns = await this.execute('pragma table_info(`session`);');
    if (!sessionColumns.some((column) => column.name === 'impersonatedBy')) {
      this.addSql('alter table `session` add column `impersonatedBy` text null;');
    }

    this.addSql('pragma foreign_keys = off;');
    this.addSql(`
      create table \`session__guest_alter\` (
        \`id\` text not null primary key,
        \`createdAt\` datetime not null,
        \`createdBy\` text null,
        \`updatedAt\` datetime not null,
        \`updatedBy\` text null,
        \`deletedAt\` datetime null,
        \`deletedBy\` text null,
        \`metadata\` json null,
        \`token\` text not null,
        \`user\` text null,
        \`expiresAt\` datetime null,
        \`ipAddress\` text null,
        \`userAgent\` text null,
        \`impersonatedBy\` text null,
        constraint \`session_user_foreign\`
          foreign key (\`user\`) references \`user\` (\`id\`) on delete cascade
      );
    `);
    this.addSql(`
      insert into \`session__guest_alter\` (
        \`id\`, \`createdAt\`, \`createdBy\`, \`updatedAt\`, \`updatedBy\`,
        \`deletedAt\`, \`deletedBy\`, \`metadata\`, \`token\`, \`user\`,
        \`expiresAt\`, \`ipAddress\`, \`userAgent\`, \`impersonatedBy\`
      )
      select
        s.\`id\`, s.\`createdAt\`, s.\`createdBy\`, s.\`updatedAt\`, s.\`updatedBy\`,
        s.\`deletedAt\`, s.\`deletedBy\`,
        case
          when u.\`isAnonymous\` = 1 then json_remove(coalesce(s.\`metadata\`, '{}'), '$.guestId')
          else s.\`metadata\`
        end,
        s.\`token\`,
        case when u.\`isAnonymous\` = 1 then null else s.\`user\` end,
        s.\`expiresAt\`, s.\`ipAddress\`, s.\`userAgent\`, s.\`impersonatedBy\`
      from \`session\` s
      left join \`user\` u on u.\`id\` = s.\`user\`;
    `);
    this.addSql('drop table `session`;');
    this.addSql('alter table `session__guest_alter` rename to `session`;');
    this.addSql('create unique index `session_token_unique` on `session` (`token`);');
    this.addSql('create index `session_user_index` on `session` (`user`);');

    this.addSql('delete from `account` where `user` in (select `id` from `user` where `isAnonymous` = 1);');
    this.addSql('delete from `twoFactor` where `user` in (select `id` from `user` where `isAnonymous` = 1);');
    this.addSql('delete from `user_term_agreement` where `user` in (select `id` from `user` where `isAnonymous` = 1);');
    this.addSql('delete from `user` where `isAnonymous` = 1;');
    this.addSql('pragma foreign_keys = on;');
  }

  override down(): void | Promise<void> {
    throw new Error('Guest session metadata migration is intentionally irreversible.');
  }
}
