import { Global, Module } from '@nestjs/common';

import { AccessTokenService } from './access-token.service';
import { AuthCacheService } from './auth-cache.service';

@Global()
@Module({
  providers: [AccessTokenService, AuthCacheService],
  exports: [AccessTokenService, AuthCacheService],
})
export class SecurityModule {}
