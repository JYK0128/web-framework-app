import { Injectable } from '@nestjs/common';

import { getErrorMessage } from '#/common/helpers/error.helper';
import { type OAuthProfile, type OAuthProvider } from '#/common/services/oauth/oauth.interface';
import { env } from '#/env';

import { BaseOAuthChannel } from './base.channel';

@Injectable()
export class GoogleOAuthChannel extends BaseOAuthChannel {
  readonly provider: OAuthProvider = 'google';

  protected readonly authorizeUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  protected readonly tokenUrl = 'https://oauth2.googleapis.com/token';
  protected readonly userInfoUrl = 'https://openidconnect.googleapis.com/v1/userinfo';
  protected override readonly revokeUrl = 'https://oauth2.googleapis.com/revoke';
  protected readonly scope = 'openid email profile';
  protected readonly callbackRoute = '/api/v1/auth/google/callback';

  protected override getDefaultClientId(): string {
    return env.GOOGLE_CLIENT_ID;
  }

  protected override getDefaultClientSecret(): string {
    return env.GOOGLE_CLIENT_SECRET;
  }

  protected normalizeProfile(data: Record<string, unknown>): OAuthProfile | null {
    if (typeof data.sub !== 'string' || typeof data.email !== 'string' || data.email_verified !== true) {
      return null;
    }

    return {
      id: data.sub,
      email: data.email,
      name: typeof data.name === 'string' ? data.name : undefined,
      avatarUrl: typeof data.picture === 'string' ? data.picture : undefined,
    };
  }

  async revokeToken(token: string): Promise<void> {
    try {
      await fetch(`${this.revokeUrl}?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal: AbortSignal.timeout(5000),
      });
    }
    catch (error) {
      this.logger.warn(`Failed to revoke Google token: ${getErrorMessage(error, 'Unknown error')}`);
    }
  }
}
