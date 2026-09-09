import { Migration } from '@mikro-orm/migrations';

/** Remove protocol/technical TTLs that are now owned by common/configs. */
export class Migration20260907021000 extends Migration {
  override up(): void {
    this.addSql(`
      update "system_config"
      set "value" = "value"
        #- '{session,sessionTimeoutMinutes}'
        #- '{session,oauthStateTtlMinutes}'
        #- '{twoFactor,challengeTtlMinutes}'
      where "key" = 'security';
    `);
  }

  override down(): void {
    // Technical TTLs are code-owned and are intentionally not restored.
  }
}
