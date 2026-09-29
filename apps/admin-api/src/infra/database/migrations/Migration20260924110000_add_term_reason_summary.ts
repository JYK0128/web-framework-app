import { Migration } from '@mikro-orm/migrations';

// eslint-disable-next-line sonarjs/class-name
export class Migration20260924110000_add_term_reason_summary extends Migration {
  override up(): void {
    this.addSql('alter table "term" add column "reason" text not null default \'\', add column "summary" text not null default \'\';');
    this.addSql('alter table "term" alter column "reason" drop default, alter column "summary" drop default;');
  }

  override down(): void {
    this.addSql('alter table "term" drop column "reason", drop column "summary";');
  }
}
