import { Migration } from '@mikro-orm/migrations';
import { encrypt, hmac } from '@pkg/shared/server';

import { env } from '#/env';

type UserPiiRow = {
  id: string
  email: string
  phoneNumber: string | null
};

// eslint-disable-next-line sonarjs/class-name
export class Migration20260922100000_encrypt_user_pii extends Migration {
  override async up(): Promise<void> {
    await this.execute('alter table "user" add column "emailEncrypted" text null;');
    await this.execute('alter table "user" add column "emailHash" varchar(64) null;');
    await this.execute('alter table "user" add column "phoneNumberEncrypted" text null;');
    await this.execute('alter table "user" add column "phoneNumberHash" varchar(64) null;');

    const users = await this.execute('select "id", "email", "phoneNumber" from "user";') as UserPiiRow[];
    for (const user of users) {
      const email = user.email;
      const phoneNumber = user.phoneNumber;
      await this.execute(
        'update "user" set "emailEncrypted" = ?, "emailHash" = ?, "phoneNumberEncrypted" = ?, "phoneNumberHash" = ? where "id" = ?;',
        [
          encrypt(email, env.PII_ENCRYPTION_KEY),
          hmac(email, env.PII_HASH_KEY),
          phoneNumber ? encrypt(phoneNumber, env.PII_ENCRYPTION_KEY) : null,
          phoneNumber ? hmac(phoneNumber, env.PII_HASH_KEY) : null,
          user.id,
        ],
      );
    }

    await this.execute('update "account" set "accountId" = "user";');
    await this.execute('alter table "user" drop constraint "user_email_unique";');
    await this.execute('alter table "user" drop constraint "user_phoneNumber_unique";');
    await this.execute('alter table "user" alter column "emailEncrypted" set not null;');
    await this.execute('alter table "user" alter column "emailHash" set not null;');
    await this.execute('alter table "user" add constraint "user_emailHash_unique" unique ("emailHash");');
    await this.execute('alter table "user" add constraint "user_phoneNumberHash_unique" unique ("phoneNumberHash");');
    await this.execute('alter table "user" drop column "email";');
    await this.execute('alter table "user" drop column "phoneNumber";');
  }
}
