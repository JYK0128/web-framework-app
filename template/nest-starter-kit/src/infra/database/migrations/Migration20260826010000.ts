import { Migration } from '@mikro-orm/migrations';

export class Migration20260826010000 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`
      alter table "notice"
        alter column "priority" drop default,
        alter column "priority" type varchar(10)
          using case "priority"
            when 0 then 'LOW'
            when 1 then 'NORMAL'
            when 2 then 'HIGH'
            else 'LOW'
          end,
        alter column "priority" set default 'LOW';
    `);
  }

  override down(): void | Promise<void> {
    this.addSql(`
      alter table "notice"
        alter column "priority" drop default,
        alter column "priority" type int
          using case "priority"
            when 'LOW' then 0
            when 'NORMAL' then 1
            when 'HIGH' then 2
            else 0
          end,
        alter column "priority" set default 0;
    `);
  }
}
