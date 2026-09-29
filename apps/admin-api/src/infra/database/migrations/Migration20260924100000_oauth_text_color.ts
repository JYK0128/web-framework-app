import { Migration } from '@mikro-orm/migrations';

// eslint-disable-next-line sonarjs/class-name
export class Migration20260924100000_oauth_text_color extends Migration {
  override up(): void {
    const colors = { google: '#1F1F1F', kakao: '#191919', naver: '#FFFFFF' };
    for (const [provider, color] of Object.entries(colors)) {
      this.addSql(`
        update "system_config"
        set "value" = jsonb_set("value", '{${provider},brandTextColor}', '"${color}"'::jsonb, true)
        where "code" = 'oauth'
          and "value" ? '${provider}'
          and not ("value"->'${provider}' ? 'brandTextColor');
      `);
    }
  }
}
