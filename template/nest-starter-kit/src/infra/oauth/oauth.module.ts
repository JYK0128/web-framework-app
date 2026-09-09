import { type DynamicModule, Module } from '@nestjs/common';

import { OAUTH_MODULE_OPTIONS, OAUTH_PROVIDERS, type OAuthModuleOptions } from './oauth.interface';
import { OAuthService } from './oauth.service';

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
        {
          provide: OAUTH_PROVIDERS,
          useValue: [],
        },
        OAuthService,
      ],
      exports: [OAuthService],
    };
  }
}
