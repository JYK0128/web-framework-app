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
            'rememberMeTtlMinutes', 43200
          ) || coalesce("value"->'session', '{}'::jsonb),
          'twoFactor', jsonb_build_object(
            'challengeTtlMinutes', 10
          ) || coalesce("value"->'twoFactor', '{}'::jsonb),
          'oauthStateTtlMinutes', 10,
          'verification', jsonb_build_object(
            'emailChallengeExpiryMinutes', 15,
            'passwordResetChallengeExpiryMinutes', 15,
            'phoneChallengeExpiryMinutes', 5
          ) || coalesce("value"->'verification', '{}'::jsonb)
        )
      where "key" = 'security';
    `);
  }

  override down(): void {
    this.addSql(`
      update "system_config"
      set "value" = "value"
        #- '{session,timeoutMinutes}'
        #- '{session,rememberMeTtlMinutes}'
        #- '{twoFactor,challengeTtlMinutes}'
        #- '{oauthStateTtlMinutes}'
        #- '{verification}'
      where "key" = 'security';
    `);
  }
}
