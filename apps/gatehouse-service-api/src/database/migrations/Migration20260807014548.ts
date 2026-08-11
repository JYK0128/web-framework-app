import { Migration } from '@mikro-orm/migrations';

export class Migration20260807014548 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`create table \`term_group\` (\`id\` text not null primary key, \`createdAt\` datetime not null, \`createdBy\` text null, \`updatedAt\` datetime not null, \`updatedBy\` text null, \`deletedAt\` datetime null, \`deletedBy\` text null, \`metadata\` json null, \`code\` text not null, \`title\` text not null, \`isRequired\` integer not null default false, \`sortOrder\` integer not null default 0);`);
    this.addSql(`create unique index \`term_group_code_unique\` on \`term_group\` (\`code\`);`);

    this.addSql(`alter table \`term\` drop column \`code\`;`);
    this.addSql(`alter table \`term\` drop column \`isRequired\`;`);
    this.addSql(`alter table \`term\` drop column \`name\`;`);
    this.addSql(`alter table \`term\` add column \`metadata\` json null;`);
    this.addSql(`alter table \`term\` add column \`termGroup\` text not null constraint \`term_termGroup_foreign\` references \`term_group\` (\`id\`) on delete cascade;`);
    this.addSql(`create index \`term_termGroup_index\` on \`term\` (\`termGroup\`);`);

    this.addSql(`pragma foreign_keys = off;`);
    this.addSql(`create table \`user__temp_alter\` (\`id\` text not null primary key, \`createdAt\` datetime not null, \`createdBy\` text null, \`updatedAt\` datetime not null, \`updatedBy\` text null, \`deletedAt\` datetime null, \`deletedBy\` text null, \`metadata\` json null, \`name\` text not null, \`email\` text not null, \`emailVerified\` integer not null default false, \`isAnonymous\` integer not null default false, \`image\` text null, \`twoFactorEnabled\` integer not null default false);`);
    this.addSql(`insert into \`user__temp_alter\` select \`id\`, \`createdAt\`, \`createdBy\`, \`updatedAt\`, \`updatedBy\`, \`deletedAt\`, \`deletedBy\`, \`metadata\`, \`name\`, \`email\`, \`emailVerified\`, \`isAnonymous\`, \`image\`, \`twoFactorEnabled\` from \`user\`;`);
    this.addSql(`drop table \`user\`;`);
    this.addSql(`alter table \`user__temp_alter\` rename to \`user\`;`);
    this.addSql(`create unique index \`user_email_unique\` on \`user\` (\`email\`);`);
    this.addSql(`pragma foreign_keys = on;`);

    this.addSql(`pragma foreign_keys = off;`);
    this.addSql(`create table \`session__temp_alter\` (\`id\` text not null primary key, \`createdAt\` datetime not null, \`createdBy\` text null, \`updatedAt\` datetime not null, \`updatedBy\` text null, \`deletedAt\` datetime null, \`deletedBy\` text null, \`metadata\` json null, \`token\` text not null, \`user\` text not null, \`expiresAt\` datetime null, \`ipAddress\` text null, \`userAgent\` text null, constraint \`session_user_foreign\` foreign key (\`user\`) references \`user\` (\`id\`) on delete cascade);`);
    this.addSql(`insert into \`session__temp_alter\` select \`id\`, \`createdAt\`, \`createdBy\`, \`updatedAt\`, \`updatedBy\`, \`deletedAt\`, \`deletedBy\`, \`metadata\`, \`token\`, \`user\`, \`expiresAt\`, \`ipAddress\`, \`userAgent\` from \`session\`;`);
    this.addSql(`drop table \`session\`;`);
    this.addSql(`alter table \`session__temp_alter\` rename to \`session\`;`);
    this.addSql(`create unique index \`session_token_unique\` on \`session\` (\`token\`);`);
    this.addSql(`create index \`session_user_index\` on \`session\` (\`user\`);`);
    this.addSql(`pragma foreign_keys = on;`);

    this.addSql(`pragma foreign_keys = off;`);
    this.addSql(`create table \`account__temp_alter\` (\`id\` text not null primary key, \`createdAt\` datetime not null, \`createdBy\` text null, \`updatedAt\` datetime not null, \`updatedBy\` text null, \`deletedAt\` datetime null, \`deletedBy\` text null, \`user\` text not null, \`accountId\` text not null, \`providerId\` text not null, \`accessToken\` text null, \`refreshToken\` text null, \`accessTokenExpiresAt\` datetime null, \`refreshTokenExpiresAt\` datetime null, \`scope\` text null, \`idToken\` text null, \`password\` text null, \`metadata\` json null, constraint \`account_user_foreign\` foreign key (\`user\`) references \`user\` (\`id\`) on delete cascade);`);
    this.addSql(`insert into \`account__temp_alter\` select \`id\`, \`createdAt\`, \`createdBy\`, \`updatedAt\`, \`updatedBy\`, \`deletedAt\`, \`deletedBy\`, \`user\`, \`accountId\`, \`providerId\`, \`accessToken\`, \`refreshToken\`, \`accessTokenExpiresAt\`, \`refreshTokenExpiresAt\`, \`scope\`, \`idToken\`, \`password\`, \`metadata\` from \`account\`;`);
    this.addSql(`drop table \`account\`;`);
    this.addSql(`alter table \`account__temp_alter\` rename to \`account\`;`);
    this.addSql(`create index \`account_user_index\` on \`account\` (\`user\`);`);
    this.addSql(`pragma foreign_keys = on;`);

    this.addSql(`alter table \`user_term_agreement\` add column \`metadata\` json null;`);
    this.addSql(`create index \`user_term_agreement_user_index\` on \`user_term_agreement\` (\`user\`);`);
    this.addSql(`create index \`user_term_agreement_term_index\` on \`user_term_agreement\` (\`term\`);`);

    this.addSql(`pragma foreign_keys = off;`);
    this.addSql(`create table \`verification__temp_alter\` (\`id\` text not null primary key, \`createdAt\` datetime not null, \`createdBy\` text null, \`updatedAt\` datetime not null, \`updatedBy\` text null, \`deletedAt\` datetime null, \`deletedBy\` text null, \`metadata\` json null, \`identifier\` text not null, \`value\` text not null, \`expiresAt\` datetime not null);`);
    this.addSql(`insert into \`verification__temp_alter\` select \`id\`, \`createdAt\`, \`createdBy\`, \`updatedAt\`, \`updatedBy\`, \`deletedAt\`, \`deletedBy\`, \`metadata\`, \`identifier\`, \`value\`, \`expiresAt\` from \`verification\`;`);
    this.addSql(`drop table \`verification\`;`);
    this.addSql(`alter table \`verification__temp_alter\` rename to \`verification\`;`);
    this.addSql(`pragma foreign_keys = on;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists \`term_group\`;`);

    this.addSql(`pragma foreign_keys = off;`);
    this.addSql(`create table \`account__temp_alter\` (\`accessToken\` text null, \`accessTokenExpiresAt\` datetime null, \`accountId\` text not null, \`createdAt\` datetime not null, \`createdBy\` text null, \`deletedAt\` datetime null, \`deletedBy\` text null, \`id\` text not null primary key, \`idToken\` text null, \`metadata\` text null, \`password\` text null, \`providerId\` text not null, \`refreshToken\` text null, \`refreshTokenExpiresAt\` datetime null, \`scope\` text null, \`updatedAt\` datetime not null, \`updatedBy\` text null, \`user\` text not null, constraint \`account_user_foreign\` foreign key (\`user\`) references \`user\` (\`id\`) on delete cascade);`);
    this.addSql(`insert into \`account__temp_alter\` select \`accessToken\`, \`accessTokenExpiresAt\`, \`accountId\`, \`createdAt\`, \`createdBy\`, \`deletedAt\`, \`deletedBy\`, \`id\`, \`idToken\`, \`metadata\`, \`password\`, \`providerId\`, \`refreshToken\`, \`refreshTokenExpiresAt\`, \`scope\`, \`updatedAt\`, \`updatedBy\`, \`user\` from \`account\`;`);
    this.addSql(`drop table \`account\`;`);
    this.addSql(`alter table \`account__temp_alter\` rename to \`account\`;`);
    this.addSql(`create index \`account_user_index\` on \`account\` (\`user\`);`);
    this.addSql(`pragma foreign_keys = on;`);

    this.addSql(`pragma foreign_keys = off;`);
    this.addSql(`create table \`session__temp_alter\` (\`createdAt\` datetime not null, \`createdBy\` text null, \`deletedAt\` datetime null, \`deletedBy\` text null, \`expiresAt\` datetime not null, \`id\` text not null primary key, \`ipAddress\` text null, \`metadata\` text null, \`token\` text not null, \`updatedAt\` datetime not null, \`updatedBy\` text null, \`user\` text not null, \`userAgent\` text null, constraint \`session_user_foreign\` foreign key (\`user\`) references \`user\` (\`id\`) on delete cascade);`);
    this.addSql(`insert into \`session__temp_alter\` select \`createdAt\`, \`createdBy\`, \`deletedAt\`, \`deletedBy\`, \`expiresAt\`, \`id\`, \`ipAddress\`, \`metadata\`, \`token\`, \`updatedAt\`, \`updatedBy\`, \`user\`, \`userAgent\` from \`session\`;`);
    this.addSql(`drop table \`session\`;`);
    this.addSql(`alter table \`session__temp_alter\` rename to \`session\`;`);
    this.addSql(`create unique index \`session_token_unique\` on \`session\` (\`token\`);`);
    this.addSql(`create index \`session_user_index\` on \`session\` (\`user\`);`);
    this.addSql(`pragma foreign_keys = on;`);

    this.addSql(`drop index \`term_termGroup_index\`;`);
    this.addSql(`alter table \`term\` drop column \`metadata\`;`);
    this.addSql(`alter table \`term\` drop column \`termGroup\`;`);
    this.addSql(`alter table \`term\` add column \`code\` text not null;`);
    this.addSql(`alter table \`term\` add column \`isRequired\` integer not null default 0;`);
    this.addSql(`alter table \`term\` add column \`name\` text not null;`);

    this.addSql(`pragma foreign_keys = off;`);
    this.addSql(`create table \`user__temp_alter\` (\`createdAt\` datetime not null, \`createdBy\` text null, \`deletedAt\` datetime null, \`deletedBy\` text null, \`email\` text not null, \`emailVerified\` integer not null default false, \`id\` text not null primary key, \`image\` text null, \`isAnonymous\` integer not null default false, \`metadata\` text null, \`name\` text not null, \`twoFactorEnabled\` integer not null default 0, \`updatedAt\` datetime not null, \`updatedBy\` text null);`);
    this.addSql(`insert into \`user__temp_alter\` select \`createdAt\`, \`createdBy\`, \`deletedAt\`, \`deletedBy\`, \`email\`, \`emailVerified\`, \`id\`, \`image\`, \`isAnonymous\`, \`metadata\`, \`name\`, \`twoFactorEnabled\`, \`updatedAt\`, \`updatedBy\` from \`user\`;`);
    this.addSql(`drop table \`user\`;`);
    this.addSql(`alter table \`user__temp_alter\` rename to \`user\`;`);
    this.addSql(`create unique index \`user_email_unique\` on \`user\` (\`email\`);`);
    this.addSql(`pragma foreign_keys = on;`);

    this.addSql(`drop index \`user_term_agreement_user_index\`;`);
    this.addSql(`drop index \`user_term_agreement_term_index\`;`);
    this.addSql(`alter table \`user_term_agreement\` drop column \`metadata\`;`);

    this.addSql(`pragma foreign_keys = off;`);
    this.addSql(`create table \`verification__temp_alter\` (\`createdAt\` datetime not null, \`createdBy\` text null, \`deletedAt\` datetime null, \`deletedBy\` text null, \`expiresAt\` datetime not null, \`id\` text not null primary key, \`identifier\` text not null, \`metadata\` text null, \`updatedAt\` datetime not null, \`updatedBy\` text null, \`value\` text not null);`);
    this.addSql(`insert into \`verification__temp_alter\` select \`createdAt\`, \`createdBy\`, \`deletedAt\`, \`deletedBy\`, \`expiresAt\`, \`id\`, \`identifier\`, \`metadata\`, \`updatedAt\`, \`updatedBy\`, \`value\` from \`verification\`;`);
    this.addSql(`drop table \`verification\`;`);
    this.addSql(`alter table \`verification__temp_alter\` rename to \`verification\`;`);
    this.addSql(`pragma foreign_keys = on;`);
  }
}
