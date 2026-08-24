import { type DynamicModule, Global, Module } from '@nestjs/common';

import { OAUTH_MODULE_OPTIONS, OAUTH_PROVIDERS, type OAuthModuleOptions } from './oauth.interface';
import { OAuthService } from './oauth.service';
import { GithubOAuthProvider } from './providers/github.provider';
import { GoogleOAuthProvider } from './providers/google.provider';
import { KakaoOAuthProvider } from './providers/kakao.provider';
import { NaverOAuthProvider } from './providers/naver.provider';

@Global()
@Module({})
export class OAuthModule {
  static forRoot(options?: OAuthModuleOptions): DynamicModule {
    return {
      module: OAuthModule,
      global: true,
      providers: [
        {
          provide: OAUTH_MODULE_OPTIONS,
          useValue: options ?? {},
        },
        GoogleOAuthProvider,
        KakaoOAuthProvider,
        NaverOAuthProvider,
        GithubOAuthProvider,
        {
          provide: OAUTH_PROVIDERS,
          useFactory: (
            google: GoogleOAuthProvider,
            kakao: KakaoOAuthProvider,
            naver: NaverOAuthProvider,
            github: GithubOAuthProvider,
          ) => [google, kakao, naver, github],
          inject: [GoogleOAuthProvider, KakaoOAuthProvider, NaverOAuthProvider, GithubOAuthProvider],
        },
        OAuthService,
      ],
      exports: [OAuthService],
    };
  }
}
