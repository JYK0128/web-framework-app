import { Migration } from '@mikro-orm/migrations';

// eslint-disable-next-line sonarjs/class-name
export class Migration20261002020000_remove_profile_organization_fields extends Migration {
  override up(): void {
    this.addSql('alter table "profile" drop constraint "profile_employeeNo_unique", drop column "employeeNo", drop column "department";');
    this.addSql('alter table "profile" rename column "identityCiHash" to "ciHash";');
    this.addSql('alter table "profile" rename column "identityDiHash" to "diHash";');
    this.addSql('alter table "profile" rename constraint "profile_identityCiHash_unique" to "profile_ciHash_unique";');
    this.addSql('alter table "profile" rename constraint "profile_identityDiHash_unique" to "profile_diHash_unique";');
  }

  override down(): void {
    this.addSql('alter table "profile" rename constraint "profile_ciHash_unique" to "profile_identityCiHash_unique";');
    this.addSql('alter table "profile" rename constraint "profile_diHash_unique" to "profile_identityDiHash_unique";');
    this.addSql('alter table "profile" rename column "ciHash" to "identityCiHash";');
    this.addSql('alter table "profile" rename column "diHash" to "identityDiHash";');
    this.addSql('alter table "profile" add column "employeeNo" varchar(50) null, add column "department" varchar(100) null;');
    this.addSql('alter table "profile" add constraint "profile_employeeNo_unique" unique ("employeeNo");');
  }
}
