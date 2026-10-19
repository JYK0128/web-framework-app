import { Migration } from '@mikro-orm/migrations';

export class Migration20260924100000 extends Migration {
  override up(): void {
    const colors = {
      google: '#1F1F1F',
      kakao: '#191919',
      naver: '#FFFFFF',
      facebook: '#FFFFFF',
      instagram: '#FFFFFF',
      x: '#FFFFFF',
    };
    for (const [provider, color] of Object.entries(colors)) {
      this.addSql(`
        update "system_config"
        set "value" = jsonb_set("value", '{${provider},brandTextColor}', '"${color}"'::jsonb, true)
        where "key" = 'oauth'
          and "value" ? '${provider}'
          and not ("value"->'${provider}' ? 'brandTextColor');
      `);
    }
  }
}
