import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AuthController } from './auth.controller';
import { AuthTokenService } from './auth-token.service';
import { authHandlers } from './handlers/index';

@Module({
  imports: [CqrsModule],
  controllers: [AuthController],
  providers: [
    AuthTokenService,
    ...authHandlers,
  ],
  exports: [AuthTokenService],
})
export class AuthModule {}
