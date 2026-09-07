import { Injectable } from '@nestjs/common';

import type { OAuthProfile, OAuthProvider } from '#/infra/oauth/oauth.interface';

import { BaseOAuthProvider } from './base.provider';

export interface GenericProviderOptions {
  provider: string
  authorizeUrl?: string
  tokenUrl?: string
  userInfoUrl?: string
  defaultScope?: string
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
    ?? (typeof data.preferred_username === 'string' ? data.preferred_username : undefined)
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
    ?? (typeof data.avatar_url === 'string' ? data.avatar_url : undefined)
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
export class GenericOAuthProvider extends BaseOAuthProvider {
  readonly provider: OAuthProvider;
  protected readonly authorizeUrl: string;
  protected readonly tokenUrl: string;
  protected readonly userInfoUrl: string;
  protected readonly scope: string;
  protected override readonly revokeUrl?: string;

  constructor(options: GenericProviderOptions) {
    super();
    this.provider = options.provider;

    this.authorizeUrl = options.authorizeUrl || '';
    this.tokenUrl = options.tokenUrl || '';
    this.userInfoUrl = options.userInfoUrl || '';
    this.scope = options.defaultScope || 'openid email profile';
    this.revokeUrl = options.revokeUrl;
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
}
