import { type DynamicModule, Global, Module } from '@nestjs/common';

import { GithubOAuthChannel } from './channels/github.channel';
import { GoogleOAuthChannel } from './channels/google.channel';
import { KakaoOAuthChannel } from './channels/kakao.channel';
import { NaverOAuthChannel } from './channels/naver.channel';
import { OAUTH_CHANNELS, OAUTH_MODULE_OPTIONS, type OAuthModuleOptions } from './oauth.interface';
import { OAuthService } from './oauth.service';

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
        GoogleOAuthChannel,
        KakaoOAuthChannel,
        NaverOAuthChannel,
        GithubOAuthChannel,
        {
          provide: OAUTH_CHANNELS,
          useFactory: (
            google: GoogleOAuthChannel,
            kakao: KakaoOAuthChannel,
            naver: NaverOAuthChannel,
            github: GithubOAuthChannel,
          ) => [google, kakao, naver, github],
          inject: [GoogleOAuthChannel, KakaoOAuthChannel, NaverOAuthChannel, GithubOAuthChannel],
        },
        OAuthService,
      ],
      exports: [OAuthService],
    };
  }
}
