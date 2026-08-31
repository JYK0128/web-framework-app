import { Migration } from '@mikro-orm/migrations';

export class Migration20260827000000 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`
      insert into "alert" (
        "id",
        "createdAt",
        "updatedAt",
        "metadata",
        "user",
        "type",
        "title",
        "content",
        "linkUrl",
        "isRead"
      )
      select
        md5(random()::text || clock_timestamp()::text || notice."id" || app_user."id"),
        now(),
        now(),
        jsonb_build_object('source', 'notice-backfill', 'noticeId', notice."id"),
        app_user."id",
        'notice',
        '📢 새 공지사항',
        notice."title",
        '/notice',
        false
      from "notice" as notice
      cross join "user" as app_user
      where notice."deletedAt" is null
        and notice."publishedAt" is not null
        and notice."publishedAt" <= now()
        and (notice."expiresAt" is null or notice."expiresAt" > now())
        and app_user."deletedAt" is null
        and (app_user."banExpires" is null or app_user."banExpires" <= now())
        and not exists (
          select 1
          from "alert" as existing_alert
          where existing_alert."metadata"->>'source' = 'notice-backfill'
            and existing_alert."metadata"->>'noticeId' = notice."id"
            and existing_alert."user" = app_user."id"
        );
    `);
  }

  override down(): void | Promise<void> {
    this.addSql(`
      delete from "alert"
      where "metadata"->>'source' = 'notice-backfill';
    `);
  }
}
