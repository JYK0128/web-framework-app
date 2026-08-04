import { Migration } from '@mikro-orm/migrations';

export class Migration20260804070112BetterAuthCoreSchema extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`create table \`user\` (\`id\` text not null primary key, \`name\` text not null, \`email\` text not null, \`email_verified\` integer not null default false, \`image\` text null, \`created_at\` datetime not null, \`created_by\` text null, \`updated_at\` datetime not null, \`updated_by\` text null, \`deleted_at\` datetime null, \`deleted_by\` text null);`);
    this.addSql(`create unique index \`user_email_unique\` on \`user\` (\`email\`);`);

    this.addSql(`create table \`session\` (\`id\` text not null primary key, \`token\` text not null, \`user_id\` text not null, \`expires_at\` datetime not null, \`ip_address\` text null, \`user_agent\` text null, \`created_at\` datetime not null, \`created_by\` text null, \`updated_at\` datetime not null, \`updated_by\` text null, \`deleted_at\` datetime null, \`deleted_by\` text null, constraint \`session_user_id_foreign\` foreign key (\`user_id\`) references \`user\` (\`id\`) on delete cascade);`);
    this.addSql(`create unique index \`session_token_unique\` on \`session\` (\`token\`);`);
    this.addSql(`create index \`session_user_id_index\` on \`session\` (\`user_id\`);`);

    this.addSql(`create table \`account\` (\`id\` text not null primary key, \`user_id\` text not null, \`account_id\` text not null, \`provider_id\` text not null, \`access_token\` text null, \`refresh_token\` text null, \`access_token_expires_at\` datetime null, \`refresh_token_expires_at\` datetime null, \`scope\` text null, \`id_token\` text null, \`password\` text null, \`created_at\` datetime not null, \`created_by\` text null, \`updated_at\` datetime not null, \`updated_by\` text null, \`deleted_at\` datetime null, \`deleted_by\` text null, constraint \`account_user_id_foreign\` foreign key (\`user_id\`) references \`user\` (\`id\`) on delete cascade);`);
    this.addSql(`create index \`account_user_id_index\` on \`account\` (\`user_id\`);`);

    this.addSql(`create table \`verification\` (\`id\` text not null primary key, \`identifier\` text not null, \`value\` text not null, \`expires_at\` datetime not null, \`created_at\` datetime not null, \`created_by\` text null, \`updated_at\` datetime not null, \`updated_by\` text null, \`deleted_at\` datetime null, \`deleted_by\` text null);`);
  }

  override down(): void | Promise<void> {
    this.addSql('drop table if exists `account`;');
    this.addSql('drop table if exists `session`;');
    this.addSql('drop table if exists `verification`;');
    this.addSql('drop table if exists `user`;');
  }
}
