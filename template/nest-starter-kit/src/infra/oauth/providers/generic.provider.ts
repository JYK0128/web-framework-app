import { Injectable, Logger } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

import { OAUTH_CALLBACK_PATH, OAUTH_HTTP_TIMEOUT_MS } from '#/common/configs/integration.config';
import type { IOAuthProvider, OAuthContext, OAuthProfile, OAuthProvider, OAuthToken } from '#/infra/oauth/oauth.interface';

export interface GenericProviderOptions {
  provider: string
  authorizeUrl: string
  tokenUrl: string
  userInfoUrl: string
  defaultScope: string
  revokeUrl?: string
}

function extractId(data: Record<string, unknown>): string | null {
  const rawId
    = data.sub
      ?? data.id
      ?? data.user_id
      ?? (data.response as Record<string, unknown> | undefined)?.id
      ?? (data.data as Record<string, unknown> | undefined)?.id
      ?? (data.user as Record<string, unknown> | undefined)?.id;

  if (typeof rawId === 'string' || typeof rawId === 'number') {
    return String(rawId);
  }
  return null;
}

function extractEmail(data: Record<string, unknown>, id: string, provider: string): string {
  const email
    = (typeof data.email === 'string' ? data.email : undefined)
      ?? (typeof (data.kakao_account as Record<string, unknown> | undefined)?.email === 'string'
        ? ((data.kakao_account as Record<string, unknown>).email as string)
        : undefined)
      ?? (typeof (data.response as Record<string, unknown> | undefined)?.email === 'string'
        ? ((data.response as Record<string, unknown>).email as string)
        : undefined)
      ?? (typeof (data.data as Record<string, unknown> | undefined)?.email === 'string'
        ? ((data.data as Record<string, unknown>).email as string)
        : undefined)
      ?? (typeof (data.user as Record<string, unknown> | undefined)?.email === 'string'
        ? ((data.user as Record<string, unknown>).email as string)
        : undefined);

  return email || `${id}@${provider}.oauth`;
}

function extractName(data: Record<string, unknown>, email: string): string {
  return (typeof data.name === 'string' ? data.name : undefined)
    ?? (typeof data.nickname === 'string' ? data.nickname : undefined)
    ?? (typeof data.username === 'string' ? data.username : undefined)
    ?? (typeof data.preferred_username === 'string' ? data.preferred_username : undefined)
    ?? (typeof (data.data as Record<string, unknown> | undefined)?.name === 'string'
      ? ((data.data as Record<string, unknown>).name as string)
      : undefined)
    ?? (typeof (data.data as Record<string, unknown> | undefined)?.username === 'string'
      ? ((data.data as Record<string, unknown>).username as string)
      : undefined)
    ?? (typeof (data.properties as Record<string, unknown> | undefined)?.nickname === 'string'
      ? ((data.properties as Record<string, unknown>).nickname as string)
      : undefined)
    ?? (typeof (data.kakao_account as Record<string, unknown> | undefined)?.profile === 'object'
      ? (((data.kakao_account as Record<string, unknown>).profile as Record<string, unknown>)?.nickname as string)
      : undefined)
    ?? (typeof (data.response as Record<string, unknown> | undefined)?.name === 'string'
      ? ((data.response as Record<string, unknown>).name as string)
      : undefined)
    ?? (typeof (data.response as Record<string, unknown> | undefined)?.nickname === 'string'
      ? ((data.response as Record<string, unknown>).nickname as string)
      : undefined)
    ?? email.split('@')[0];
}

function extractAvatarUrl(data: Record<string, unknown>): string | undefined {
  return (typeof data.picture === 'string' ? data.picture : undefined)
    ?? (typeof ((data.picture as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined)?.url === 'string'
      ? (((data.picture as Record<string, unknown>).data as Record<string, unknown>).url as string)
      : undefined)
    ?? (typeof data.avatar_url === 'string' ? data.avatar_url : undefined)
    ?? (typeof (data.data as Record<string, unknown> | undefined)?.profile_image_url === 'string'
      ? ((data.data as Record<string, unknown>).profile_image_url as string)
      : undefined)
    ?? (typeof (data.properties as Record<string, unknown> | undefined)?.profile_image === 'string'
      ? ((data.properties as Record<string, unknown>).profile_image as string)
      : undefined)
    ?? (typeof (data.kakao_account as Record<string, unknown> | undefined)?.profile === 'object'
      ? (((data.kakao_account as Record<string, unknown>).profile as Record<string, unknown>)?.profile_image_url as string)
      : undefined)
    ?? (typeof (data.response as Record<string, unknown> | undefined)?.profile_image === 'string'
      ? ((data.response as Record<string, unknown>).profile_image as string)
      : undefined);
}

@Injectable()
export class GenericOAuthProvider implements IOAuthProvider {
  readonly provider: OAuthProvider;
  protected readonly authorizeUrl: string;
  protected readonly tokenUrl: string;
  protected readonly userInfoUrl: string;
  protected readonly scope: string;
  protected readonly revokeUrl?: string;

  protected readonly logger = new Logger(this.constructor.name);

  protected get callbackRoute(): string {
    return `${OAUTH_CALLBACK_PATH}/${this.provider}/callback`;
  }

  constructor(options: GenericProviderOptions) {
    this.provider = options.provider;
    this.authorizeUrl = options.authorizeUrl;
    this.tokenUrl = options.tokenUrl;
    this.userInfoUrl = options.userInfoUrl;
    this.scope = options.defaultScope;
    this.revokeUrl = options.revokeUrl;
  }

  createAuthorizeUrl(state: string, context: OAuthContext): string {
    const { clientId } = context.credentials;
    const callbackUrl = this.getCallbackUrl(context.callbackUrl);
    const scope = context.scope ?? this.scope;

    const url = new URL(this.authorizeUrl);
    url.search = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope,
      state,
      access_type: 'offline',
      prompt: 'consent',
    }).toString();

    return url.toString();
  }

  async exchangeCode(code: string, context: OAuthContext): Promise<OAuthToken | null> {
    try {
      this.logger.log(`[OAuth:${this.provider}] 토큰 교환 요청`);
      const { clientId, clientSecret } = context.credentials;
      const callbackUrl = this.getCallbackUrl(context.callbackUrl);

      const res = await fetch(this.tokenUrl, {
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
        signal: AbortSignal.timeout(OAUTH_HTTP_TIMEOUT_MS),
      });

      if (!res.ok) {
        this.logger.warn(`${this.provider} token exchange failed with status ${res.status}`);
        return null;
      }

      const body = (await res.json()) as Record<string, unknown>;
      const accessToken = typeof body.access_token === 'string' ? body.access_token : undefined;
      const refreshToken = typeof body.refresh_token === 'string' ? body.refresh_token : undefined;

      if (!accessToken) return null;

      this.logger.log(`[OAuth:${this.provider}] 토큰 교환 성공`);
      return { accessToken, refreshToken };
    }
    catch (error) {
      this.logger.warn(`${this.provider} token exchange failed: ${ApplicationError.from(error, 'OAUTH_TOKEN_EXCHANGE_FAILED').message}`);
      return null;
    }
  }

  async fetchProfile(accessToken: string): Promise<OAuthProfile | null> {
    try {
      this.logger.log(`[OAuth:${this.provider}] 프로필 조회 요청`);
      const res = await fetch(this.userInfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(OAUTH_HTTP_TIMEOUT_MS),
      });

      if (!res.ok) return null;

      const data = (await res.json()) as Record<string, unknown>;
      const profile = this.normalizeProfile(data);
      if (profile) {
        this.logger.log(`[OAuth:${this.provider}] 프로필 조회 성공 (ID: ${profile.id})`);
      }
      return profile;
    }
    catch (error) {
      this.logger.warn(`${this.provider} fetchProfile failed: ${ApplicationError.from(error, 'OAUTH_FETCH_PROFILE_FAILED').message}`);
      return null;
    }
  }

  /**
   * Universal Profile Normalizer:
   * OIDC 표준 Claims 및 주요 서드파티 중첩 구조(Google, Apple, MS, Discord, Kakao, Naver 등)를 자동 정규화
   */
  protected normalizeProfile(data: Record<string, unknown>): OAuthProfile | null {
    if (!data || typeof data !== 'object') {
      return null;
    }

    const id = extractId(data);
    if (!id) {
      this.logger.warn(`[OAuth:${this.provider}] 사용자 고유 식별자(sub/id)를 찾을 수 없습니다.`);
      return null;
    }

    const email = extractEmail(data, id, this.provider);
    const name = extractName(data, email);
    const avatarUrl = extractAvatarUrl(data);

    return {
      id,
      email,
      name,
      avatarUrl,
    };
  }

  protected getCallbackUrl(callbackUrl: string): string {
    return new URL(this.callbackRoute, `${callbackUrl.replace(/\/$/, '')}/`).toString();
  }
}
