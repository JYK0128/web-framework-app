import { Injectable } from '@nestjs/common';

import { type OAuthProfile, type OAuthProvider } from '#/common/services/oauth/oauth.interface';

import { BaseOAuthChannel } from './base.channel';

@Injectable()
export class GithubOAuthChannel extends BaseOAuthChannel {
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

    const avatarUrl = typeof data.avatar_url === 'string' ? data.avatar_url : undefined;

    return {
      id,
      email: data.email,
      name,
      avatarUrl,
    };
  }
}
