import { Migration } from '@mikro-orm/migrations';

export class Migration20260828000000 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`
      delete from "message_template" as duplicate
      where exists (
        select 1
        from "message_template" as preferred
        where preferred."code" = duplicate."code"
          and preferred."id" <> duplicate."id"
          and (
            (
              duplicate."locale" <> 'ko'
              and preferred."locale" = 'ko'
            )
            or (
              not exists (
                select 1
                from "message_template" as korean
                where korean."code" = duplicate."code"
                  and korean."locale" = 'ko'
              )
              and preferred."id" < duplicate."id"
            )
          )
      );
    `);
    this.addSql(`alter table "message_template" drop constraint if exists "message_template_code_locale_unique";`);
    this.addSql(`alter table "message_template" drop column "locale";`);
    this.addSql(`alter table "message_template" add constraint "message_template_code_unique" unique ("code");`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "message_template" drop constraint if exists "message_template_code_unique";`);
    this.addSql(`alter table "message_template" add column "locale" varchar(10) not null default 'ko';`);
    this.addSql(`alter table "message_template" add constraint "message_template_code_locale_unique" unique ("code", "locale");`);
  }
}
