import { Migration } from '@mikro-orm/migrations';

export class Migration20260815135254 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`create table \`faq\` (\`id\` text not null primary key, \`createdAt\` datetime not null, \`createdBy\` text null, \`updatedAt\` datetime not null, \`updatedBy\` text null, \`deletedAt\` datetime null, \`deletedBy\` text null, \`metadata\` json null, \`category\` text not null, \`question\` text not null, \`answer\` text not null, \`order\` integer not null default 0, \`isPublished\` integer not null default true, \`helpfulCount\` integer not null default 0);`);

    this.addSql(`create table \`notice\` (\`id\` text not null primary key, \`createdAt\` datetime not null, \`createdBy\` text null, \`updatedAt\` datetime not null, \`updatedBy\` text null, \`deletedAt\` datetime null, \`deletedBy\` text null, \`metadata\` json null, \`title\` text not null, \`content\` text not null, \`isPinned\` integer not null default false, \`priority\` integer not null default 0, \`publishedAt\` datetime null, \`expiresAt\` datetime null);`);

    this.addSql(`create table \`role\` (\`id\` text not null primary key, \`createdAt\` datetime not null, \`createdBy\` text null, \`updatedAt\` datetime not null, \`updatedBy\` text null, \`deletedAt\` datetime null, \`deletedBy\` text null, \`metadata\` json null, \`name\` text not null, \`permissions\` json not null);`);
    this.addSql(`create unique index \`role_name_unique\` on \`role\` (\`name\`);`);

    this.addSql(`create table \`term_group\` (\`id\` text not null primary key, \`createdAt\` datetime not null, \`createdBy\` text null, \`updatedAt\` datetime not null, \`updatedBy\` text null, \`deletedAt\` datetime null, \`deletedBy\` text null, \`metadata\` json null, \`code\` text not null, \`title\` text not null, \`isRequired\` integer not null default false, \`sortOrder\` integer not null default 0);`);
    this.addSql(`create unique index \`term_group_code_unique\` on \`term_group\` (\`code\`);`);

    this.addSql(`create table \`term\` (\`id\` text not null primary key, \`createdAt\` datetime not null, \`createdBy\` text null, \`updatedAt\` datetime not null, \`updatedBy\` text null, \`deletedAt\` datetime null, \`deletedBy\` text null, \`metadata\` json null, \`termGroup\` text not null, \`version\` text not null, \`content\` text not null, \`publishedAt\` datetime null, constraint \`term_termGroup_foreign\` foreign key (\`termGroup\`) references \`term_group\` (\`id\`) on delete cascade);`);
    this.addSql(`create index \`term_termGroup_index\` on \`term\` (\`termGroup\`);`);

    this.addSql(`create table \`user\` (\`id\` text not null primary key, \`createdAt\` datetime not null, \`createdBy\` text null, \`updatedAt\` datetime not null, \`updatedBy\` text null, \`deletedAt\` datetime null, \`deletedBy\` text null, \`metadata\` json null, \`name\` text not null, \`email\` text not null, \`emailVerified\` integer not null default false, \`image\` text null, \`twoFactorEnabled\` integer not null default false, \`banned\` integer not null default false, \`banReason\` text null, \`banExpires\` datetime null, \`role\` text null);`);
    this.addSql(`create unique index \`user_email_unique\` on \`user\` (\`email\`);`);

    this.addSql(`create table \`twoFactor\` (\`id\` text not null primary key, \`createdAt\` datetime not null, \`createdBy\` text null, \`updatedAt\` datetime not null, \`updatedBy\` text null, \`deletedAt\` datetime null, \`deletedBy\` text null, \`metadata\` json null, \`secret\` text not null, \`backupCodes\` text null, \`verified\` integer not null default false, \`failedVerificationCount\` integer not null default 0, \`lockedUntil\` datetime null, \`user\` text not null, constraint \`twoFactor_user_foreign\` foreign key (\`user\`) references \`user\` (\`id\`) on delete cascade);`);
    this.addSql(`create index \`twoFactor_user_index\` on \`twoFactor\` (\`user\`);`);

    this.addSql(`create table \`notice_read\` (\`id\` text not null primary key, \`createdAt\` datetime not null, \`createdBy\` text null, \`updatedAt\` datetime not null, \`updatedBy\` text null, \`deletedAt\` datetime null, \`deletedBy\` text null, \`metadata\` json null, \`user\` text not null, \`notice\` text not null, \`readAt\` datetime not null, constraint \`notice_read_user_foreign\` foreign key (\`user\`) references \`user\` (\`id\`) on delete cascade, constraint \`notice_read_notice_foreign\` foreign key (\`notice\`) references \`notice\` (\`id\`) on delete cascade);`);
    this.addSql(`create index \`notice_read_user_index\` on \`notice_read\` (\`user\`);`);
    this.addSql(`create index \`notice_read_notice_index\` on \`notice_read\` (\`notice\`);`);
    this.addSql(`create unique index \`notice_read_user_notice_unique\` on \`notice_read\` (\`user\`, \`notice\`);`);

    this.addSql(`create table \`account\` (\`id\` text not null primary key, \`createdAt\` datetime not null, \`createdBy\` text null, \`updatedAt\` datetime not null, \`updatedBy\` text null, \`deletedAt\` datetime null, \`deletedBy\` text null, \`user\` text not null, \`accountId\` text not null, \`providerId\` text not null, \`accessToken\` text null, \`refreshToken\` text null, \`accessTokenExpiresAt\` datetime null, \`refreshTokenExpiresAt\` datetime null, \`scope\` text null, \`idToken\` text null, \`password\` text null, \`metadata\` json null, constraint \`account_user_foreign\` foreign key (\`user\`) references \`user\` (\`id\`) on delete cascade);`);
    this.addSql(`create index \`account_user_index\` on \`account\` (\`user\`);`);

    this.addSql(`create table \`user_term_agreement\` (\`id\` text not null primary key, \`createdAt\` datetime not null, \`createdBy\` text null, \`updatedAt\` datetime not null, \`updatedBy\` text null, \`deletedAt\` datetime null, \`deletedBy\` text null, \`metadata\` json null, \`user\` text not null, \`term\` text not null, \`isAgreed\` integer not null, constraint \`user_term_agreement_user_foreign\` foreign key (\`user\`) references \`user\` (\`id\`) on delete cascade, constraint \`user_term_agreement_term_foreign\` foreign key (\`term\`) references \`term\` (\`id\`) on delete cascade);`);
    this.addSql(`create index \`user_term_agreement_user_index\` on \`user_term_agreement\` (\`user\`);`);
    this.addSql(`create index \`user_term_agreement_term_index\` on \`user_term_agreement\` (\`term\`);`);

    this.addSql(`create table \`verification\` (\`id\` text not null primary key, \`createdAt\` datetime not null, \`createdBy\` text null, \`updatedAt\` datetime not null, \`updatedBy\` text null, \`deletedAt\` datetime null, \`deletedBy\` text null, \`metadata\` json null, \`identifier\` text not null, \`value\` text not null, \`expiresAt\` datetime not null);`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists \`faq\`;`);
    this.addSql(`drop table if exists \`notice\`;`);
    this.addSql(`drop table if exists \`role\`;`);
    this.addSql(`drop table if exists \`term_group\`;`);
    this.addSql(`drop table if exists \`term\`;`);
    this.addSql(`drop table if exists \`user\`;`);
    this.addSql(`drop table if exists \`twoFactor\`;`);
    this.addSql(`drop table if exists \`notice_read\`;`);
    this.addSql(`drop table if exists \`account\`;`);
    this.addSql(`drop table if exists \`user_term_agreement\`;`);
    this.addSql(`drop table if exists \`verification\`;`);
  }
}
