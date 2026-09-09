import { Migration } from '@mikro-orm/migrations';

export class Migration20260907010000 extends Migration {
  override up(): void {
    this.addSql(`
      update "system_config"
      set "value" = "value" || jsonb_build_object(
        'password', '{"changeDeferDays":30}'::jsonb || coalesce("value"->'password', '{}'::jsonb),
        'twoFactor', '{"challengeTtlMinutes":10}'::jsonb || coalesce("value"->'twoFactor', '{}'::jsonb),
        'session', '{"oauthStateTtlMinutes":10}'::jsonb || coalesce("value"->'session', '{}'::jsonb)
      )
      where "key" = 'security';
    `);
  }

  override down(): void {
    // Keep configured policy values when rolling back; older versions ignore them.
  }
}
