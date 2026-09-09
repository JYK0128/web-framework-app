import { Migration } from '@mikro-orm/migrations';

/** Store OAuth provider protocol endpoints in system_config. */
export class Migration20260907040000 extends Migration {
  override up(): void {
    this.addSql(`
      update "system_config"
      set "value" = jsonb_build_object(
        'google', jsonb_build_object(
          'enabled', false, 'name', 'Google', 'clientId', '', 'clientSecret', '',
          'authorizeUrl', 'https://accounts.google.com/o/oauth2/v2/auth',
          'tokenUrl', 'https://oauth2.googleapis.com/token',
          'userInfoUrl', 'https://openidconnect.googleapis.com/v1/userinfo',
          'revokeUrl', 'https://oauth2.googleapis.com/revoke', 'scope', 'openid email profile',
          'iconUrl', '/oauth-icons/google.png'
        ),
        'kakao', jsonb_build_object(
          'enabled', false, 'name', 'Kakao', 'clientId', '', 'clientSecret', '',
          'authorizeUrl', 'https://kauth.kakao.com/oauth/authorize',
          'tokenUrl', 'https://kauth.kakao.com/oauth/token',
          'userInfoUrl', 'https://kapi.kakao.com/v2/user/me',
          'revokeUrl', 'https://kapi.kakao.com/v1/user/unlink', 'scope', 'profile_nickname account_email',
          'iconUrl', '/oauth-icons/kakao.png'
        ),
        'naver', jsonb_build_object(
          'enabled', false, 'name', 'Naver', 'clientId', '', 'clientSecret', '',
          'authorizeUrl', 'https://nid.naver.com/oauth2.0/authorize',
          'tokenUrl', 'https://nid.naver.com/oauth2.0/token',
          'userInfoUrl', 'https://openapi.naver.com/v1/nid/me', 'scope', 'email name',
          'iconUrl', '/oauth-icons/naver.png'
        )
      ) || coalesce("value", '{}'::jsonb)
      where "key" = 'oauth';
    `);
  }

  override down(): void {
    this.addSql(`update "system_config" set "value" = '{}'::jsonb where "key" = 'oauth';`);
  }
}
