import { Migration } from '@mikro-orm/migrations';

// eslint-disable-next-line sonarjs/class-name
export class Migration20260924130000_remove_term_group_code extends Migration {
  override up(): void {
    this.addSql('alter table "term_group" drop column "code";');
  }

  override down(): void {
    this.addSql('alter table "term_group" add column "code" varchar(50);');
    this.addSql('update "term_group" set "code" = "id";');
    this.addSql('alter table "term_group" alter column "code" set not null;');
    this.addSql('alter table "term_group" add constraint "term_group_code_unique" unique ("code");');
  }
}
