import { Inject, Injectable, Logger } from '@nestjs/common';

import { Account } from '#/entities/auth/account.entity';

import { type IOAuthProvider, OAUTH_MODULE_OPTIONS, OAUTH_PROVIDERS, type OAuthContext, type OAuthModuleOptions, type OAuthProfile, type OAuthProvider, type OAuthToken } from './oauth.interface';

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);
  private readonly providerMap = new Map<OAuthProvider, IOAuthProvider>();

  constructor(
    @Inject(OAUTH_PROVIDERS)
    private readonly providers: IOAuthProvider[],
    @Inject(OAUTH_MODULE_OPTIONS)
    private readonly options: OAuthModuleOptions,
  ) {
    for (const provider of providers) {
      this.providerMap.set(provider.provider, provider);
    }
  }

  /**
   * 프로바이더별 인가(Authorize) URL 생성
   */
  createAuthorizeUrl(provider: OAuthProvider, state: string): string {
    const oauthProvider = this.getProvider(provider);
    return oauthProvider.createAuthorizeUrl(state, this.getContext(provider));
  }

  /**
   * 인가 코드를 액세스/리프레시 토큰으로 교환
   */
  async exchangeCode(provider: OAuthProvider, code: string): Promise<OAuthToken | null> {
    const oauthProvider = this.getProvider(provider);
    return oauthProvider.exchangeCode(code, this.getContext(provider));
  }

  /**
   * 액세스 토큰으로 서드파티 사용자 프로필 조회 및 표준 프로필 형식으로 변환
   */
  async fetchProfile(provider: OAuthProvider, accessToken: string): Promise<OAuthProfile | null> {
    const oauthProvider = this.getProvider(provider);
    return oauthProvider.fetchProfile(accessToken);
  }

  /**
   * 계정 연동 해제 및 외부 토큰 폐기
   */
  async revokeAccount(account: Account): Promise<void> {
    const token = account.refreshToken || account.accessToken;
    if (!token || account.providerId === Account.PROVIDER_CREDENTIAL) return;

    const provider = this.providerMap.get(account.providerId);
    if (provider?.revokeToken) {
      await provider.revokeToken(token);
    }
  }

  /**
   * 현재 등록된 OAuth 제공자 목록 조회
   */
  getSupportedProviders(): OAuthProvider[] {
    return Array.from(this.providerMap.keys());
  }

  /**
   * 특정 OAuth 제공자가 등록되어 있는지 여부 확인
   */
  hasProvider(provider: OAuthProvider): boolean {
    return this.providerMap.has(provider);
  }

  private getProvider(provider: OAuthProvider): IOAuthProvider {
    const oauthProvider = this.providerMap.get(provider);
    if (!oauthProvider) {
      throw new Error(`Unsupported OAuth provider: ${provider}`);
    }
    return oauthProvider;
  }

  private getContext(provider: OAuthProvider): OAuthContext {
    const credentials = this.options.providers?.[provider];

    if (!credentials) {
      throw new Error(`OAuth credentials for ${provider} are not configured`);
    }

    return {
      callbackUrl: this.options.callbackUrl,
      credentials,
    };
  }
}
