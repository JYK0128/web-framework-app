import { Injectable } from '@nestjs/common';
import { when } from '@pkg/shared/common';

import { type OAuthProfile, type OAuthProvider } from '#/infra/oauth/oauth.interface';

import { BaseOAuthProvider } from './base.provider';

@Injectable()
export class GithubOAuthProvider extends BaseOAuthProvider {
  readonly provider: OAuthProvider = 'github';

  protected readonly authorizeUrl = 'https://github.com/login/oauth/authorize';
  protected readonly tokenUrl = 'https://github.com/login/oauth/access_token';
  protected readonly userInfoUrl = 'https://api.github.com/user';
  protected readonly scope = 'read:user user:email';
  protected readonly callbackRoute = '/api/v1/auth/github/callback';

  protected normalizeProfile(data: Record<string, unknown>): OAuthProfile | null {
    const id = typeof data.id === 'number' || typeof data.id === 'string' ? String(data.id) : null;
    if (!id || typeof data.email !== 'string') return null;

    let name: string | undefined;
    if (typeof data.name === 'string') name = data.name;
    else if (typeof data.login === 'string') name = data.login;

    const avatarUrl = when((value): value is string => typeof value === 'string', (avatarUrl) => avatarUrl)(data.avatar_url);

    return {
      id,
      email: data.email,
      name,
      avatarUrl,
    };
  }
}
