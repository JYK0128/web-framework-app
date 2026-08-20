import { Inject, Injectable, Logger, Optional } from '@nestjs/common';

import { getErrorMessage } from '#/common/helpers/error.helper';
import type { Account } from '#/entities/auth/account.entity';
import { env } from '#/env';

export const OAUTH_MODULE_OPTIONS = Symbol('OAUTH_MODULE_OPTIONS');

export type OAuthProvider = 'google' | 'kakao' | 'naver' | 'github';

export interface OAuthProviderConfig {
  provider: OAuthProvider
  authorizeUrl: string
  tokenUrl: string
  userInfoUrl: string
  revokeUrl?: string
  scope: string
  callbackRoute: string
}

export interface OAuthModuleOptions {
  frontendUrl?: string
  providers?: Partial<Record<OAuthProvider, {
    clientId?: string
    clientSecret?: string
  }>>
}

export interface OAuthProfile {
  id: string
  email: string
  name?: string
}

export interface OAuthToken {
  accessToken: string
  refreshToken?: string
}

const PROVIDER_CONFIGS: Record<OAuthProvider, OAuthProviderConfig> = {
  google: {
    provider: 'google',
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
    revokeUrl: 'https://oauth2.googleapis.com/revoke',
    scope: 'openid email profile',
    callbackRoute: '/api/v1/auth/google/callback',
  },
  kakao: {
    provider: 'kakao',
    authorizeUrl: 'https://kauth.kakao.com/oauth/authorize',
    tokenUrl: 'https://kauth.kakao.com/oauth/token',
    userInfoUrl: 'https://kapi.kakao.com/v2/user/me',
    revokeUrl: 'https://kapi.kakao.com/v1/user/unlink',
    scope: 'account_email profile_nickname',
    callbackRoute: '/api/v1/auth/kakao/callback',
  },
  naver: {
    provider: 'naver',
    authorizeUrl: 'https://nid.naver.com/oauth2.0/authorize',
    tokenUrl: 'https://nid.naver.com/oauth2.0/token',
    userInfoUrl: 'https://openapi.naver.com/v1/nid/me',
    scope: 'email name',
    callbackRoute: '/api/v1/auth/naver/callback',
  },
  github: {
    provider: 'github',
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    scope: 'read:user user:email',
    callbackRoute: '/api/v1/auth/github/callback',
  },
};

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  constructor(
    @Optional()
    @Inject(OAUTH_MODULE_OPTIONS)
    private readonly options?: OAuthModuleOptions,
  ) {}

  /**
   * 프로바이더별 인가(Authorize) URL 생성
   */
  createAuthorizeUrl(provider: OAuthProvider, state: string): string {
    const config = PROVIDER_CONFIGS[provider];
    if (!config) {
      throw new Error(`Unsupported OAuth provider: ${provider}`);
    }

    const clientId = this.getClientId(provider);
    const callbackUrl = this.getCallbackUrl(provider);

    const url = new URL(config.authorizeUrl);
    url.search = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: config.scope,
      state,
      access_type: 'offline',
      prompt: 'consent',
    }).toString();

    return url.toString();
  }

  /**
   * 인가 코드를 액세스/리프레시 토큰으로 교환
   */
  async exchangeCode(provider: OAuthProvider, code: string): Promise<OAuthToken | null> {
    const config = PROVIDER_CONFIGS[provider];
    if (!config) return null;

    try {
      const clientId = this.getClientId(provider);
      const clientSecret = this.getClientSecret(provider);
      const callbackUrl = this.getCallbackUrl(provider);

      const res = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: callbackUrl,
          grant_type: 'authorization_code',
        }),
      });

      if (!res.ok) {
        this.logger.warn(`OAuth token exchange for ${provider} failed with status ${res.status}`);
        return null;
      }

      const body = await res.json() as Record<string, unknown>;
      const accessToken = typeof body.access_token === 'string' ? body.access_token : undefined;
      const refreshToken = typeof body.refresh_token === 'string' ? body.refresh_token : undefined;

      if (!accessToken) return null;

      return {
        accessToken,
        refreshToken,
      };
    }
    catch (error) {
      this.logger.warn(`OAuth token exchange for ${provider} failed: ${getErrorMessage(error, 'Unknown error')}`);
      return null;
    }
  }

  /**
   * 액세스 토큰으로 서드파티 사용자 프로필 조회 및 표준 프로필 형식으로 변환
   */
  async fetchProfile(provider: OAuthProvider, accessToken: string): Promise<OAuthProfile | null> {
    const config = PROVIDER_CONFIGS[provider];
    if (!config) return null;

    try {
      const res = await fetch(config.userInfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) return null;

      const data = (await res.json()) as Record<string, unknown>;
      return this.normalizeProfile(provider, data);
    }
    catch (error) {
      this.logger.warn(`OAuth fetchProfile for ${provider} failed: ${getErrorMessage(error, 'Unknown error')}`);
      return null;
    }
  }

  /**
   * 계정 연동 해제 및 외부 토큰 폐기
   */
  async revokeAccount(account: Account): Promise<void> {
    const token = account.refreshToken || account.accessToken;
    if (!token) return;

    const provider = account.providerId as OAuthProvider;
    const config = PROVIDER_CONFIGS[provider];
    if (!config?.revokeUrl) return;

    try {
      if (provider === 'google') {
        await fetch(`${config.revokeUrl}?token=${encodeURIComponent(token)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
      }
      else if (provider === 'kakao') {
        await fetch(config.revokeUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });
      }
    }
    catch (error) {
      this.logger.warn(`Failed to revoke ${provider} token: ${getErrorMessage(error, 'Unknown error')}`);
    }
  }

  private normalizeProfile(provider: OAuthProvider, data: Record<string, unknown>): OAuthProfile | null {
    switch (provider) {
      case 'google':
        return this.normalizeGoogleProfile(data);
      case 'kakao':
        return this.normalizeKakaoProfile(data);
      case 'naver':
        return this.normalizeNaverProfile(data);
      case 'github':
        return this.normalizeGithubProfile(data);
      default:
        return null;
    }
  }

  private normalizeGoogleProfile(data: Record<string, unknown>): OAuthProfile | null {
    if (typeof data.sub !== 'string' || typeof data.email !== 'string' || data.email_verified !== true) return null;
    return {
      id: data.sub,
      email: data.email,
      name: typeof data.name === 'string' ? data.name : undefined,
    };
  }

  private normalizeKakaoProfile(data: Record<string, unknown>): OAuthProfile | null {
    const id = typeof data.id === 'number' || typeof data.id === 'string' ? String(data.id) : null;
    const kakaoAccount = typeof data.kakao_account === 'object' && data.kakao_account !== null ? data.kakao_account as Record<string, unknown> : null;
    const email = typeof kakaoAccount?.email === 'string' ? kakaoAccount.email : null;
    const profile = typeof kakaoAccount?.profile === 'object' && kakaoAccount.profile !== null ? kakaoAccount.profile as Record<string, unknown> : null;
    const name = typeof profile?.nickname === 'string' ? profile.nickname : undefined;
    if (!id || !email) return null;
    return { id, email, name };
  }

  private normalizeNaverProfile(data: Record<string, unknown>): OAuthProfile | null {
    const response = typeof data.response === 'object' && data.response !== null ? data.response as Record<string, unknown> : null;
    if (typeof response?.id !== 'string' || typeof response.email !== 'string') return null;
    return {
      id: response.id,
      email: response.email,
      name: typeof response.name === 'string' ? response.name : undefined,
    };
  }

  private normalizeGithubProfile(data: Record<string, unknown>): OAuthProfile | null {
    const id = typeof data.id === 'number' || typeof data.id === 'string' ? String(data.id) : null;
    if (!id || typeof data.email !== 'string') return null;
    let name: string | undefined;
    if (typeof data.name === 'string') name = data.name;
    else if (typeof data.login === 'string') name = data.login;

    return {
      id,
      email: data.email,
      name,
    };
  }

  private getClientId(provider: OAuthProvider): string {
    if (provider === 'google') {
      return this.options?.providers?.google?.clientId || env.GOOGLE_CLIENT_ID;
    }
    return this.options?.providers?.[provider]?.clientId || '';
  }

  private getClientSecret(provider: OAuthProvider): string {
    if (provider === 'google') {
      return this.options?.providers?.google?.clientSecret || env.GOOGLE_CLIENT_SECRET;
    }
    return this.options?.providers?.[provider]?.clientSecret || '';
  }

  private getCallbackUrl(provider: OAuthProvider): string {
    const config = PROVIDER_CONFIGS[provider];
    const frontendUrl = this.options?.frontendUrl || env.FRONTEND_URL;
    return new URL(
      config.callbackRoute,
      `${frontendUrl.replace(/\/$/, '')}/`,
    ).toString();
  }
}
