import { Injectable } from '@nestjs/common';
import { ApplicationError, when } from '@pkg/shared/common';

import { type OAuthProfile, type OAuthProvider } from '#/infra/oauth/oauth.interface';

import { BaseOAuthProvider } from './base.provider';

@Injectable()
export class KakaoOAuthProvider extends BaseOAuthProvider {
  readonly provider: OAuthProvider = 'kakao';

  protected readonly authorizeUrl = 'https://kauth.kakao.com/oauth/authorize';
  protected readonly tokenUrl = 'https://kauth.kakao.com/oauth/token';
  protected readonly userInfoUrl = 'https://kapi.kakao.com/v2/user/me';
  protected override readonly revokeUrl = 'https://kapi.kakao.com/v1/user/unlink';
  protected readonly scope = 'account_email profile_nickname';
  protected readonly callbackRoute = '/api/v1/auth/kakao/callback';

  protected normalizeProfile(data: Record<string, unknown>): OAuthProfile | null {
    const id = typeof data.id === 'number' || typeof data.id === 'string' ? String(data.id) : null;
    const kakaoAccount = typeof data.kakao_account === 'object' && data.kakao_account !== null
      ? (data.kakao_account as Record<string, unknown>)
      : null;
    const email = typeof kakaoAccount?.email === 'string' ? kakaoAccount.email : null;
    const profile = typeof kakaoAccount?.profile === 'object' && kakaoAccount.profile !== null
      ? (kakaoAccount.profile as Record<string, unknown>)
      : null;
    const name = when((value): value is string => typeof value === 'string', (name) => name)(profile?.nickname);
    const avatarUrl = when((value): value is string => typeof value === 'string', (avatarUrl) => avatarUrl)(profile?.profile_image_url);

    if (!id || !email) return null;

    return {
      id,
      email,
      name,
      avatarUrl,
    };
  }

  async revokeToken(token: string): Promise<void> {
    try {
      await fetch(this.revokeUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        signal: AbortSignal.timeout(5000),
      });
    }
    catch (error) {
      this.logger.warn(`Failed to revoke Kakao token: ${ApplicationError.from(error, 'OAUTH_REVOKE_TOKEN_FAILED').message}`);
    }
  }
}
