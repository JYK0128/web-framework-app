import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AuthController } from './auth.controller';
import { authHandlers } from './handlers/index';
import { OAuthController } from './oauth.controller';
import { OAuthService } from './oauth.service';

@Module({
  imports: [CqrsModule],
  controllers: [AuthController, OAuthController],
  providers: [
    ...authHandlers,
    OAuthService,
  ],
})
export class AuthModule {}
