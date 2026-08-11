import { Migration } from '@mikro-orm/migrations';

export class Migration20260805085200 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`create table \`twoFactor\` (\`id\` text not null primary key, \`createdAt\` datetime not null, \`createdBy\` text null, \`updatedAt\` datetime not null, \`updatedBy\` text null, \`deletedAt\` datetime null, \`deletedBy\` text null, \`metadata\` json null, \`secret\` text not null, \`backupCodes\` text null, \`user\` text not null, constraint \`twoFactor_user_foreign\` foreign key (\`user\`) references \`user\` (\`id\`) on delete cascade);`);
    this.addSql(`create index \`twoFactor_user_index\` on \`twoFactor\` (\`user\`);`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists \`twoFactor\`;`);
  }
}
