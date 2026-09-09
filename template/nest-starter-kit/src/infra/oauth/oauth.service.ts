import { Inject, Injectable } from '@nestjs/common';

import { SystemContext } from '#/common/contexts/system.context';
import { Account } from '#/entities/auth/account.entity';

import { type IOAuthProvider, OAUTH_MODULE_OPTIONS, OAUTH_PROVIDERS, type OAuthContext, type OAuthModuleOptions, type OAuthProfile, type OAuthProvider, type OAuthToken } from './oauth.interface';
import { GenericOAuthProvider } from './providers/generic.provider';

@Injectable()
export class OAuthService {
  constructor(
    @Inject(OAUTH_PROVIDERS)
    _providers: [],
    @Inject(OAUTH_MODULE_OPTIONS)
    private readonly options: OAuthModuleOptions,
    private readonly systemContext: SystemContext,
  ) {
  }

  /**
   * 특정 OAuth 제공자가 활성화되어 있는지 확인
   */
  async isProviderEnabled(provider: OAuthProvider): Promise<boolean> {
    const config = await this.systemContext.getOAuth();
    const providerConfig = config[provider];
    return Boolean(providerConfig?.enabled && providerConfig?.clientId);
  }

  /**
   * 현재 활성화된 OAuth 제공자의 상세 메타(이름, 아이콘, 브랜딩 컬러) 포함 목록 조회
   */
  async getEnabledProvidersWithMeta(): Promise<Array<{ id: OAuthProvider, name: string, icon?: string, brandColor?: string, iconUrl?: string }>> {
    const config = await this.systemContext.getOAuth();
    const result: Array<{ id: OAuthProvider, name: string, icon?: string, brandColor?: string, iconUrl?: string }> = [];

    for (const [provider, val] of Object.entries(config)) {
      if (val && typeof val === 'object' && val.enabled && val.clientId && val.name) {
        result.push({
          id: provider,
          name: val.name,
          icon: val.icon,
          brandColor: val.brandColor,
          iconUrl: val.iconUrl,
        });
      }
    }

    return result;
  }

  /**
   * 프로바이더별 인가(Authorize) URL 생성
   */
  async createAuthorizeUrl(provider: OAuthProvider, state: string): Promise<string> {
    const oauthProvider = await this.getProvider(provider);
    const context = await this.getContext(provider);
    return oauthProvider.createAuthorizeUrl(state, context);
  }

  /**
   * 인가 코드를 액세스/리프레시 토큰으로 교환
   */
  async exchangeCode(provider: OAuthProvider, code: string): Promise<OAuthToken | null> {
    const oauthProvider = await this.getProvider(provider);
    const context = await this.getContext(provider);
    return oauthProvider.exchangeCode(code, context);
  }

  /**
   * 액세스 토큰으로 서드파티 사용자 프로필 조회 및 표준 프로필 형식으로 변환
   */
  async fetchProfile(provider: OAuthProvider, accessToken: string): Promise<OAuthProfile | null> {
    const oauthProvider = await this.getProvider(provider);
    return oauthProvider.fetchProfile(accessToken);
  }

  /**
   * 계정 연동 해제 및 외부 토큰 폐기
   */
  async revokeAccount(account: Account): Promise<void> {
    const token = account.refreshToken || account.accessToken;
    if (!token || account.providerId === Account.PROVIDER_CREDENTIAL) return;

    const provider = await this.getProvider(account.providerId);
    if (provider.revokeToken) {
      await provider.revokeToken(token);
    }
  }

  /**
   * 특정 OAuth 제공자가 등록 또는 지원 가능한지 확인
   */
  async hasProvider(provider: OAuthProvider): Promise<boolean> {
    const config = await this.systemContext.getOAuth();
    const dbConfig = config[provider];
    return Boolean(dbConfig?.enabled && dbConfig.clientId && dbConfig.authorizeUrl && dbConfig.tokenUrl && dbConfig.userInfoUrl && dbConfig.scope);
  }

  private async getProvider(provider: OAuthProvider): Promise<IOAuthProvider> {
    const config = await this.systemContext.getOAuth();
    const dbConfig = config[provider];
    if (!dbConfig?.authorizeUrl || !dbConfig.tokenUrl || !dbConfig.userInfoUrl || !dbConfig.scope) {
      throw new Error(`OAuth provider ${provider} endpoint or scope configuration is missing`);
    }
    return new GenericOAuthProvider({
      provider,
      authorizeUrl: dbConfig.authorizeUrl,
      tokenUrl: dbConfig.tokenUrl,
      userInfoUrl: dbConfig.userInfoUrl,
      defaultScope: dbConfig.scope,
      revokeUrl: dbConfig.revokeUrl,
    });
  }

  private async getContext(provider: OAuthProvider): Promise<OAuthContext> {
    const config = await this.systemContext.getOAuth();
    const dbCreds = config[provider];

    if (!dbCreds?.enabled || !dbCreds.clientId || !dbCreds.scope) {
      throw new Error(`OAuth provider ${provider} is disabled or scope configuration is missing`);
    }

    return {
      callbackUrl: this.options.callbackUrl,
      credentials: {
        clientId: dbCreds.clientId,
        clientSecret: dbCreds.clientSecret || '',
      },
      scope: dbCreds.scope,
    };
  }
}
