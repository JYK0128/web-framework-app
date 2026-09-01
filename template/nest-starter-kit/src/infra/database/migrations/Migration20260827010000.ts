import { Migration } from '@mikro-orm/migrations';

export class Migration20260827010000 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`
      update "alert"
      set "linkUrl" = '/notice?noticeId=' || ("metadata"->>'noticeId')
      where "metadata"->>'source' = 'notice-backfill'
        and "metadata"->>'noticeId' is not null;
    `);
  }

  override down(): void | Promise<void> {
    this.addSql(`
      update "alert"
      set "linkUrl" = '/notice'
      where "metadata"->>'source' = 'notice-backfill';
    `);
  }
}
