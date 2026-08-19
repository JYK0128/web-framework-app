import { Global, Module } from '@nestjs/common';

import { AuthPermissionService } from './auth-permission.service';
import { AuthTokenCodec } from './auth-token.codec';
import { AuthTokenService } from './auth-token.service';
import { AuthTokenStore } from './auth-token.store';
import { AuthUserService } from './auth-user.service';
import { AuthVerificationStore } from './auth-verification.store';

@Global()
@Module({
  providers: [AuthTokenCodec, AuthTokenService, AuthTokenStore, AuthVerificationStore, AuthPermissionService, AuthUserService],
  exports: [AuthTokenService, AuthVerificationStore, AuthPermissionService, AuthUserService],
})
export class SecurityModule {}
