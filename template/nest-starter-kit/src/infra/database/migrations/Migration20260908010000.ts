import { Migration } from '@mikro-orm/migrations';

/** Rename the credential registration policy key. */
export class Migration20260908010000 extends Migration {
  override up(): void {
    this.addSql(`
      update "system_config"
      set "value" = ("value" - 'registration') || jsonb_build_object(
        'registration',
        (coalesce("value"->'registration', '{}'::jsonb) - 'allowPasswordRegistration')
          || jsonb_build_object(
            'allowCredentialRegistration',
            coalesce("value"->'registration'->'allowPasswordRegistration', true)
          )
      )
      where "key" = 'security'
        and "value"->'registration' ? 'allowPasswordRegistration';
    `);
  }

  override down(): void {
    this.addSql(`
      update "system_config"
      set "value" = ("value" - 'registration') || jsonb_build_object(
        'registration',
        (coalesce("value"->'registration', '{}'::jsonb) - 'allowCredentialRegistration')
          || jsonb_build_object(
            'allowPasswordRegistration',
            coalesce("value"->'registration'->'allowCredentialRegistration', true)
          )
      )
      where "key" = 'security'
        and "value"->'registration' ? 'allowCredentialRegistration';
    `);
  }
}
