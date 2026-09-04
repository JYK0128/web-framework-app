import { Injectable } from '@nestjs/common';
import { when } from '@pkg/shared/common';

import { type OAuthProfile, type OAuthProvider } from '#/infra/oauth/oauth.interface';

import { BaseOAuthProvider } from './base.provider';

@Injectable()
export class NaverOAuthProvider extends BaseOAuthProvider {
  readonly provider: OAuthProvider = 'naver';

  protected readonly authorizeUrl = 'https://nid.naver.com/oauth2.0/authorize';
  protected readonly tokenUrl = 'https://nid.naver.com/oauth2.0/token';
  protected readonly userInfoUrl = 'https://openapi.naver.com/v1/nid/me';
  protected readonly scope = 'email name';
  protected readonly callbackRoute = '/api/v1/auth/naver/callback';

  protected normalizeProfile(data: Record<string, unknown>): OAuthProfile | null {
    const response = typeof data.response === 'object' && data.response !== null
      ? (data.response as Record<string, unknown>)
      : null;

    if (typeof response?.id !== 'string' || typeof response.email !== 'string') {
      return null;
    }

    return {
      id: response.id,
      email: response.email,
      name: when((value): value is string => typeof value === 'string', (name) => name)(response.name),
      avatarUrl: when((value): value is string => typeof value === 'string', (avatarUrl) => avatarUrl)(response.profile_image),
    };
  }
}
