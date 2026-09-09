import { Migration } from '@mikro-orm/migrations';

/** Persist authentication and verification lifetimes in the security policy. */
export class Migration20260907030000 extends Migration {
  override up(): void {
    this.addSql(`
      update "system_config"
      set "value" = "value"
        || jsonb_build_object(
          'session', jsonb_build_object(
            'timeoutMinutes', 30,
            'rememberMeDays', 30
          ) || coalesce("value"->'session', '{}'::jsonb)
        )
      where "key" = 'security';
    `);
  }

  override down(): void {
    this.addSql(`
      update "system_config"
      set "value" = "value"
        #- '{session,timeoutMinutes}'
        #- '{session,rememberMeDays}'
      where "key" = 'security';
    `);
  }
}
