import { Injectable, Logger } from '@nestjs/common';

import type { Account } from '#/entities/auth/account.entity';
import { env } from '#/env';
import { GOOGLE_CALLBACK_ROUTE, GOOGLE_OAUTH_CONFIG } from '#/modules/auth/constants/google-oauth.constants';

export interface GoogleOAuthProfile {
  tokenData: {
    access_token: string
    refresh_token?: string
  }
  profile: {
    id: string
    email: string
    name?: string
  }
}

@Injectable()
export class GoogleOAuthService {
  private readonly logger = new Logger(GoogleOAuthService.name);

  /**
   * Google OAuth 인증 콜백 URL을 반환합니다.
   */
  getCallbackUrl(): string {
    return new URL(GOOGLE_CALLBACK_ROUTE, `${env.FRONTEND_URL.replace(/\/$/, '')}/`).toString();
  }

  /**
   * Google OAuth 로그인 인증 URL을 생성합니다.
   */
  getAuthorizeUrl(state: string): string {
    const authorizeUrl = new URL(GOOGLE_OAUTH_CONFIG.authorizeUrl);
    authorizeUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
    authorizeUrl.searchParams.set('redirect_uri', this.getCallbackUrl());
    authorizeUrl.searchParams.set('response_type', GOOGLE_OAUTH_CONFIG.responseType);
    authorizeUrl.searchParams.set('scope', GOOGLE_OAUTH_CONFIG.scope);
    authorizeUrl.searchParams.set('state', state);
    authorizeUrl.searchParams.set('access_type', 'offline');
    authorizeUrl.searchParams.set('prompt', 'consent');
    return authorizeUrl.toString();
  }

  /**
   * 인가 코드로 토큰을 교환하고 Google 사용자 프로필 정보를 조회합니다.
   */
  async fetchProfile(code: string): Promise<GoogleOAuthProfile | null> {
    try {
      const redirectUri = this.getCallbackUrl();
      const tokenResponse = await fetch(GOOGLE_OAUTH_CONFIG.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: env.GOOGLE_CLIENT_ID,
          client_secret: env.GOOGLE_CLIENT_SECRET,
          code,
          grant_type: GOOGLE_OAUTH_CONFIG.grantType,
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        this.logger.warn(`Google token exchange failed: ${tokenResponse.status} ${await tokenResponse.text()}`);
        return null;
      }

      const tokenData = await tokenResponse.json() as { access_token: string, refresh_token?: string };

      const profileResponse = await fetch(GOOGLE_OAUTH_CONFIG.userInfoUrl, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      if (!profileResponse.ok) {
        this.logger.warn(`Google userinfo fetch failed: ${profileResponse.status} ${await profileResponse.text()}`);
        return null;
      }

      const profile = await profileResponse.json() as { id?: string, email?: string, name?: string };

      if (!profile.id || !profile.email) {
        this.logger.warn('Google profile does not contain email');
        return null;
      }

      return {
        tokenData,
        profile: {
          id: profile.id,
          email: profile.email,
          name: profile.name,
        },
      };
    }
    catch (err) {
      this.logger.error(`Error during Google OAuth flow: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  }

  /**
   * 외부 계정 연동 시 제출된 access token이 실제 Google 계정의 것인지 확인합니다.
   */
  async fetchProfileByAccessToken(accessToken: string): Promise<GoogleOAuthProfile['profile'] | null> {
    try {
      const profileResponse = await fetch(GOOGLE_OAUTH_CONFIG.userInfoUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!profileResponse.ok) return null;

      const profile = await profileResponse.json() as { id?: string, email?: string, name?: string };
      if (!profile.id || !profile.email) return null;

      return {
        id: profile.id,
        email: profile.email,
        name: profile.name,
      };
    }
    catch (err) {
      this.logger.warn(`Google account verification failed: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  }

  /**
   * 계정 연동 해제 또는 탈퇴 시 Google OAuth 토큰을 철회(revoke)합니다.
   */
  async revokeAccount(account: Account): Promise<void> {
    const token = account.refreshToken || account.accessToken;
    if (!token) return;

    if (account.providerId === GOOGLE_OAUTH_CONFIG.provider) {
      try {
        await fetch(`${GOOGLE_OAUTH_CONFIG.revokeUrl}?token=${encodeURIComponent(token)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
      }
      catch (err) {
        this.logger.warn(`Failed to revoke Google OAuth token: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }
}
