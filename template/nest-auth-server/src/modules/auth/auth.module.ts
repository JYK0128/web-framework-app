import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';

import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { GetCurrentUserHandler } from './handlers/get-current-user.handler';
import { LoginHandler } from './handlers/login.handler';
import { LogoutHandler } from './handlers/logout.handler';
import { RegisterHandler } from './handlers/register.handler';

@Module({
  imports: [CqrsModule],
  controllers: [AuthController],
  providers: [
    RegisterHandler,
    LoginHandler,
    LogoutHandler,
    GetCurrentUserHandler,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AuthModule {}
