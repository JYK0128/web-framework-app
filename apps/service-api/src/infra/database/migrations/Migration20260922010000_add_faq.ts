import { Migration } from '@mikro-orm/migrations';

// eslint-disable-next-line sonarjs/class-name
export class Migration20260922010000_add_faq extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`create table "faq" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "category" varchar(50) not null, "question" varchar(255) not null, "answer" text not null, "sortOrder" int not null default 0, "isPublished" boolean not null default true, primary key ("id"));`);
    this.addSql(`create index "faq_category_index" on "faq" ("category");`);
    this.addSql(`create index "faq_isPublished_sortOrder_index" on "faq" ("isPublished", "sortOrder");`);
  }

  override down(): void | Promise<void> {
    this.addSql('drop table if exists "faq";');
  }
}
