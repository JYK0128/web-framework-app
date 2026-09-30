import { Migration } from '@mikro-orm/migrations';

// eslint-disable-next-line sonarjs/class-name
export class Migration20260930100000_add_profile_identity_hashes extends Migration {
  override up(): void {
    this.addSql('alter table "profile" add column "identityCiHash" varchar(64) null;');
    this.addSql('alter table "profile" add column "identityDiHash" varchar(64) null;');
    this.addSql('alter table "profile" add constraint "profile_identityCiHash_unique" unique ("identityCiHash");');
    this.addSql('alter table "profile" add constraint "profile_identityDiHash_unique" unique ("identityDiHash");');
  }

  override down(): void {
    this.addSql('alter table "profile" drop constraint "profile_identityCiHash_unique";');
    this.addSql('alter table "profile" drop constraint "profile_identityDiHash_unique";');
    this.addSql('alter table "profile" drop column "identityCiHash";');
    this.addSql('alter table "profile" drop column "identityDiHash";');
  }
}
