import { Migration } from '@mikro-orm/migrations';

export class Migration20260804070112BetterAuthCoreSchema extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`create table \`user\` (\`id\` text not null primary key, \`name\` text not null, \`email\` text not null, \`emailVerified\` integer not null default false, \`image\` text null, \`createdAt\` datetime not null, \`createdBy\` text null, \`updatedAt\` datetime not null, \`updatedBy\` text null, \`deletedAt\` datetime null, \`deletedBy\` text null);`);
    this.addSql(`create unique index \`user_email_unique\` on \`user\` (\`email\`);`);

    this.addSql(`create table \`session\` (\`id\` text not null primary key, \`token\` text not null, \`user\` text not null, \`expiresAt\` datetime not null, \`ipAddress\` text null, \`userAgent\` text null, \`createdAt\` datetime not null, \`createdBy\` text null, \`updatedAt\` datetime not null, \`updatedBy\` text null, \`deletedAt\` datetime null, \`deletedBy\` text null, constraint \`session_user_foreign\` foreign key (\`user\`) references \`user\` (\`id\`) on delete cascade);`);
    this.addSql(`create unique index \`session_token_unique\` on \`session\` (\`token\`);`);
    this.addSql(`create index \`session_user_index\` on \`session\` (\`user\`);`);

    this.addSql(`create table \`account\` (\`id\` text not null primary key, \`user\` text not null, \`accountId\` text not null, \`providerId\` text not null, \`accessToken\` text null, \`refreshToken\` text null, \`accessTokenExpiresAt\` datetime null, \`refreshTokenExpiresAt\` datetime null, \`scope\` text null, \`idToken\` text null, \`password\` text null, \`createdAt\` datetime not null, \`createdBy\` text null, \`updatedAt\` datetime not null, \`updatedBy\` text null, \`deletedAt\` datetime null, \`deletedBy\` text null, constraint \`account_user_foreign\` foreign key (\`user\`) references \`user\` (\`id\`) on delete cascade);`);
    this.addSql(`create index \`account_user_index\` on \`account\` (\`user\`);`);

    this.addSql(`create table \`verification\` (\`id\` text not null primary key, \`identifier\` text not null, \`value\` text not null, \`expiresAt\` datetime not null, \`createdAt\` datetime not null, \`createdBy\` text null, \`updatedAt\` datetime not null, \`updatedBy\` text null, \`deletedAt\` datetime null, \`deletedBy\` text null);`);

    this.addSql(`create table \`term\` (\`id\` text not null primary key, \`code\` text not null, \`name\` text not null, \`content\` text not null, \`version\` text not null, \`isRequired\` integer not null default 0, \`publishedAt\` datetime null, \`createdAt\` datetime not null, \`createdBy\` text null, \`updatedAt\` datetime not null, \`updatedBy\` text null, \`deletedAt\` datetime null, \`deletedBy\` text null);`);
    this.addSql(`create table \`user_term_agreement\` (\`id\` text not null primary key, \`user\` text not null, \`term\` text not null, \`agreedAt\` datetime not null, \`createdAt\` datetime not null, \`createdBy\` text null, \`updatedAt\` datetime not null, \`updatedBy\` text null, \`deletedAt\` datetime null, \`deletedBy\` text null, constraint \`user_term_agreement_user_foreign\` foreign key (\`user\`) references \`user\` (\`id\`) on delete cascade, constraint \`user_term_agreement_term_foreign\` foreign key (\`term\`) references \`term\` (\`id\`) on delete cascade);`);
  }

  override down(): void | Promise<void> {
    this.addSql('drop table if exists `user_term_agreement`;');
    this.addSql('drop table if exists `term`;');
    this.addSql('drop table if exists `account`;');
    this.addSql('drop table if exists `session`;');
    this.addSql('drop table if exists `verification`;');
    this.addSql('drop table if exists `user`;');
  }
}
