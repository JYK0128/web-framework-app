import { Migration } from '@mikro-orm/migrations';

// eslint-disable-next-line sonarjs/class-name
export class Migration20260929150000_add_refresh_idle_expiry extends Migration {
  override up(): void {
    this.addSql(`alter table "refresh_token" add column "idleExpiresAt" timestamptz null;`);
    this.addSql(`update "refresh_token" set "idleExpiresAt" = "expiresAt";`);
    this.addSql(`alter table "refresh_token" alter column "idleExpiresAt" set not null;`);
    this.addSql(`create index "refresh_token_idleExpiresAt_index" on "refresh_token" ("idleExpiresAt");`);
  }

  override down(): void {
    this.addSql(`drop index "refresh_token_idleExpiresAt_index";`);
    this.addSql(`alter table "refresh_token" drop column "idleExpiresAt";`);
  }
}
