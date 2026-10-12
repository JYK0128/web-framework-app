import { Global, Module } from '@nestjs/common';

import { OAuthProviderService } from './oauth.service';

@Global()
@Module({
  providers: [OAuthProviderService],
  exports: [OAuthProviderService],
})
export class OAuthModule {}
