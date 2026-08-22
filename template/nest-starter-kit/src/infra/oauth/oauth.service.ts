import { Inject, Injectable, Logger } from '@nestjs/common';

import type { Account } from '#/entities/auth/account.entity';

import { type IOAuthChannel, OAUTH_CHANNELS, OAUTH_MODULE_OPTIONS, type OAuthContext, type OAuthModuleOptions, type OAuthProfile, type OAuthProvider, type OAuthToken } from './oauth.interface';

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);
  private readonly channelMap = new Map<OAuthProvider, IOAuthChannel>();

  constructor(
    @Inject(OAUTH_CHANNELS)
    private readonly channels: IOAuthChannel[],
    @Inject(OAUTH_MODULE_OPTIONS)
    private readonly options: OAuthModuleOptions,
  ) {
    for (const channel of channels) {
      this.channelMap.set(channel.provider, channel);
    }
  }

  /**
   * 프로바이더별 인가(Authorize) URL 생성
   */
  createAuthorizeUrl(provider: OAuthProvider, state: string): string {
    const channel = this.getChannel(provider);
    return channel.createAuthorizeUrl(state, this.getContext(provider));
  }

  /**
   * 인가 코드를 액세스/리프레시 토큰으로 교환
   */
  async exchangeCode(provider: OAuthProvider, code: string): Promise<OAuthToken | null> {
    const channel = this.getChannel(provider);
    return channel.exchangeCode(code, this.getContext(provider));
  }

  /**
   * 액세스 토큰으로 서드파티 사용자 프로필 조회 및 표준 프로필 형식으로 변환
   */
  async fetchProfile(provider: OAuthProvider, accessToken: string): Promise<OAuthProfile | null> {
    const channel = this.getChannel(provider);
    return channel.fetchProfile(accessToken);
  }

  /**
   * 계정 연동 해제 및 외부 토큰 폐기
   */
  async revokeAccount(account: Account): Promise<void> {
    const token = account.refreshToken || account.accessToken;
    if (!token) return;

    const provider = account.providerId as OAuthProvider;
    const channel = this.channelMap.get(provider);

    if (channel?.revokeToken) {
      await channel.revokeToken(token);
    }
  }

  /**
   * 현재 등록된 OAuth 제공자 목록 조회
   */
  getSupportedProviders(): OAuthProvider[] {
    return Array.from(this.channelMap.keys());
  }

  /**
   * 특정 OAuth 제공자가 등록되어 있는지 여부 확인
   */
  hasProvider(provider: OAuthProvider): boolean {
    return this.channelMap.has(provider);
  }

  private getChannel(provider: OAuthProvider): IOAuthChannel {
    const channel = this.channelMap.get(provider);
    if (!channel) {
      throw new Error(`Unsupported OAuth provider: ${provider}`);
    }
    return channel;
  }

  private getContext(provider: OAuthProvider): OAuthContext {
    const callbackUrl = this.options.callbackUrl;
    const credentials = this.options[provider] ?? this.options.providers?.[provider];

    if (!credentials) {
      throw new Error(`OAuth credentials for ${provider} are not configured`);
    }

    return {
      callbackUrl,
      credentials,
    };
  }
}
