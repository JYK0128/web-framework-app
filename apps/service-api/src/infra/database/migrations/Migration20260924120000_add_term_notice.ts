import { Migration } from '@mikro-orm/migrations';

// eslint-disable-next-line sonarjs/class-name
export class Migration20260924120000_add_term_notice extends Migration {
  override up(): void {
    this.addSql('alter table "term" add column "isNoticeRequired" boolean not null default false;');
  }

  override down(): void {
    this.addSql('alter table "term" drop column "isNoticeRequired";');
  }
}
