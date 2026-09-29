import { Migration } from '@mikro-orm/migrations';

export class Migration20260924010000AddSupportRooms extends Migration {
  override up(): void {
    this.addSql(`create table "support_room" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "user_id" varchar(255) not null, "assignee_id" varchar(255) null, "title" varchar(255) not null, "channel" varchar(20) not null default 'chatbot', "status" varchar(20) not null default 'open', "lastMessageAt" timestamptz null, constraint "support_room_pkey" primary key ("id"));`);
    this.addSql(`create table "support_message" ("id" varchar(255) not null, "createdAt" timestamptz not null, "createdBy" varchar(255) null, "updatedAt" timestamptz not null, "updatedBy" varchar(255) null, "deletedAt" timestamptz null, "deletedBy" varchar(255) null, "metadata" jsonb null, "room_id" varchar(255) not null, "sender_user_id" varchar(255) null, "senderType" varchar(20) not null, "content" text not null, "readAt" timestamptz null, constraint "support_message_pkey" primary key ("id"));`);
    this.addSql(`alter table "support_room" add constraint "support_room_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table "support_room" add constraint "support_room_assignee_id_foreign" foreign key ("assignee_id") references "user" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "support_message" add constraint "support_message_room_id_foreign" foreign key ("room_id") references "support_room" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table "support_message" add constraint "support_message_sender_user_id_foreign" foreign key ("sender_user_id") references "user" ("id") on update cascade on delete set null;`);
    this.addSql(`create index "support_room_status_index" on "support_room" ("status");`);
    this.addSql(`create index "support_room_last_message_at_index" on "support_room" ("lastMessageAt");`);
    this.addSql(`create index "support_message_room_id_created_at_index" on "support_message" ("room_id", "createdAt");`);
  }

  override down(): void {
    this.addSql('drop table if exists "support_message" cascade;');
    this.addSql('drop table if exists "support_room" cascade;');
  }
}
