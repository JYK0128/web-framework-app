import { Migration } from '@mikro-orm/migrations';

export class Migration20260925010000RemoveSupportRoomChannel extends Migration {
  override up(): void {
    this.addSql('alter table "support_room" drop column "channel";');
  }

  override down(): void {
    this.addSql(`alter table "support_room" add column "channel" varchar(20) not null default 'chatbot';`);
  }
}
