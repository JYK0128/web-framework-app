import { type DynamicModule, Global, Module } from '@nestjs/common';

import { OAUTH_PROVIDER_OPTIONS, type OAuthProviderModuleOptions } from './oauth-provider.interface';
import { OAuthProviderService } from './oauth-provider.service';

@Global()
@Module({})
export class OAuthProviderModule {
  static forRoot(options: OAuthProviderModuleOptions): DynamicModule {
    return {
      module: OAuthProviderModule,
      global: true,
      providers: [
        { provide: OAUTH_PROVIDER_OPTIONS, useValue: options },
        OAuthProviderService,
      ],
      exports: [OAuthProviderService],
    };
  }
}
