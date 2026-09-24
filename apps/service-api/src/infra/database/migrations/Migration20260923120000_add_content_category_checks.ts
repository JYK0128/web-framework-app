import { Migration } from '@mikro-orm/migrations';

export class Migration20260923120000AddContentCategoryChecks extends Migration {
  override up(): void {
    this.addSql(`alter table "faq" add constraint "faq_category_check" check ("category" in ('계정', '서비스 이용', '검증'));`);
    this.addSql(`alter table "qna" add constraint "qna_category_check" check ("category" in ('계정', '서비스 이용', '검증'));`);
  }

  override down(): void {
    this.addSql('alter table "faq" drop constraint if exists "faq_category_check";');
    this.addSql('alter table "qna" drop constraint if exists "qna_category_check";');
  }
}
