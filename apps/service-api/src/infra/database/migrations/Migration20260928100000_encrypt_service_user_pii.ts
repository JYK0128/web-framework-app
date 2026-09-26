import { Migration } from '@mikro-orm/migrations';
import { decrypt, encrypt, hmac } from '@pkg/shared/server';

import { env } from '#/env';

type UserPiiRow = {
  id: string
  email: string
};

type ProfilePiiRow = {
  id: string
  phoneNumber: string | null
};

// eslint-disable-next-line sonarjs/class-name
export class Migration20260928100000_encrypt_service_user_pii extends Migration {
  override async up(): Promise<void> {
    await this.execute('alter table "user" add column "emailEncrypted" text null;');
    await this.execute('alter table "user" add column "emailHash" varchar(64) null;');
    await this.execute('alter table "profile" add column "phoneNumberEncrypted" text null;');
    await this.execute('alter table "profile" add column "phoneNumberHash" varchar(64) null;');

    const users = await this.execute('select "id", "email" from "user";') as UserPiiRow[];
    for (const user of users) {
      await this.execute(
        'update "user" set "emailEncrypted" = ?, "emailHash" = ? where "id" = ?;',
        [encrypt(user.email, env.PII_ENCRYPTION_KEY), hmac(user.email, env.PII_HASH_KEY), user.id],
      );
    }

    const profiles = await this.execute('select "id", "phoneNumber" from "profile";') as ProfilePiiRow[];
    for (const profile of profiles) {
      if (!profile.phoneNumber) continue;
      await this.execute(
        'update "profile" set "phoneNumberEncrypted" = ?, "phoneNumberHash" = ? where "id" = ?;',
        [encrypt(profile.phoneNumber, env.PII_ENCRYPTION_KEY), hmac(profile.phoneNumber, env.PII_HASH_KEY), profile.id],
      );
    }

    await this.execute('update "account" set "accountId" = "user" where "providerId" = \'credential\';');
    await this.execute('alter table "user" alter column "emailEncrypted" set not null;');
    await this.execute('alter table "user" alter column "emailHash" set not null;');
    await this.execute('alter table "user" drop constraint "user_email_unique";');
    await this.execute('alter table "user" add constraint "user_emailHash_unique" unique ("emailHash");');
    await this.execute('alter table "profile" drop constraint "profile_phoneNumber_unique";');
    await this.execute('alter table "profile" add constraint "profile_phoneNumberHash_unique" unique ("phoneNumberHash");');
    await this.execute('alter table "user" drop column "email";');
    await this.execute('alter table "profile" drop column "phoneNumber";');
  }

  override async down(): Promise<void> {
    await this.execute('alter table "user" add column "email" varchar(320) null;');
    await this.execute('alter table "profile" add column "phoneNumber" varchar(30) null;');

    const users = await this.execute('select "id", "emailEncrypted" from "user";') as Array<{ id: string, emailEncrypted: string }>;
    for (const user of users) {
      await this.execute('update "user" set "email" = ? where "id" = ?;', [decrypt(user.emailEncrypted, env.PII_ENCRYPTION_KEY), user.id]);
    }

    const profiles = await this.execute('select "id", "phoneNumberEncrypted" from "profile" where "phoneNumberEncrypted" is not null;') as Array<{ id: string, phoneNumberEncrypted: string }>;
    for (const profile of profiles) {
      await this.execute('update "profile" set "phoneNumber" = ? where "id" = ?;', [decrypt(profile.phoneNumberEncrypted, env.PII_ENCRYPTION_KEY), profile.id]);
    }

    await this.execute('update "account" set "accountId" = "user"."email" from "user" where "account"."user" = "user"."id" and "account"."providerId" = \'credential\';');
    await this.execute('alter table "user" drop constraint "user_emailHash_unique";');
    await this.execute('alter table "profile" drop constraint "profile_phoneNumberHash_unique";');
    await this.execute('alter table "user" add constraint "user_email_unique" unique ("email");');
    await this.execute('alter table "profile" add constraint "profile_phoneNumber_unique" unique ("phoneNumber");');
    await this.execute('alter table "user" alter column "email" set not null;');
    await this.execute('alter table "user" drop column "emailEncrypted";');
    await this.execute('alter table "user" drop column "emailHash";');
    await this.execute('alter table "profile" drop column "phoneNumberEncrypted";');
    await this.execute('alter table "profile" drop column "phoneNumberHash";');
  }
}
