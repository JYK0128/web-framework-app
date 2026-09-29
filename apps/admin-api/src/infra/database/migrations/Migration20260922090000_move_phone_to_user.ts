import { Migration } from '@mikro-orm/migrations';

// eslint-disable-next-line sonarjs/class-name
export class Migration20260922090000_move_phone_to_user extends Migration {
  override up(): void | Promise<void> {
    this.addSql('alter table "user" add column "phoneNumber" varchar(30) null;');
    this.addSql('alter table "user" add column "phoneNumberVerified" boolean not null default false;');
    this.addSql('alter table "user" add constraint "user_phoneNumber_unique" unique ("phoneNumber");');
    this.addSql('alter table "profile" drop constraint "profile_phoneNumber_unique";');
    this.addSql('alter table "profile" drop column "phoneNumber";');
  }
}
