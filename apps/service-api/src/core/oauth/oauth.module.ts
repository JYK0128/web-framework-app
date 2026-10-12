import { Module } from '@nestjs/common';

import { OAuthProviderService } from './oauth-provider.service';

@Module({
  providers: [OAuthProviderService],
  exports: [OAuthProviderService],
})
export class OAuthProviderModule {}
