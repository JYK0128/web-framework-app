import { type DynamicModule, Global, Module } from '@nestjs/common';

import { OAUTH_MODULE_OPTIONS, type OAuthModuleOptions, OAuthService } from './oauth.service';

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
        OAuthService,
      ],
      exports: [OAuthService],
    };
  }
}
