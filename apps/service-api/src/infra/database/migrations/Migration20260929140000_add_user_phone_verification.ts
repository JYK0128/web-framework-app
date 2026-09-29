import { Migration } from '@mikro-orm/migrations';

// eslint-disable-next-line sonarjs/class-name
export class Migration20260929140000_add_user_phone_verification extends Migration {
  override up(): void {
    this.addSql('alter table "user" add column "phoneNumberVerified" boolean not null default false;');
  }

  override down(): void {
    this.addSql('alter table "user" drop column "phoneNumberVerified";');
  }
}
