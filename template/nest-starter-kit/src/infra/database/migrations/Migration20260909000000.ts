import { Migration } from '@mikro-orm/migrations';

/** Backfill OAuth branding that was previously supplied by application fallbacks. */
export class Migration20260909000000 extends Migration {
  override up(): void {
    this.addSql(`
      update "system_config"
      set "value" = jsonb_set(
        jsonb_set(
          jsonb_set("value", '{google,brandColor}', '"#FFFFFF"'::jsonb, true),
          '{kakao,brandColor}', '"#FEE500"'::jsonb, true
        ),
        '{naver,brandColor}', '"#03A94D"'::jsonb, true
      )
      where "key" = 'oauth'
        and ("value" ? 'google' or "value" ? 'kakao' or "value" ? 'naver');

      update "system_config"
      set "value" = jsonb_set("value", '{kakao,brandColor}', '"#FEE500"'::jsonb, true)
      where "key" = 'oauth' and "value"->'kakao'->>'brandColor' = '#3C1E1E';
    `);
  }

  override down(): void {
    this.addSql(`
      update "system_config"
      set "value" = "value" #- '{google,brandColor}' #- '{kakao,brandColor}' #- '{naver,brandColor}'
      where "key" = 'oauth';
    `);
  }
}
