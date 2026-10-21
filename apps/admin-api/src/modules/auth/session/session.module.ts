import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { LoginHandler } from '~/modules/auth/session/login.handler';
import { LogoutHandler } from '~/modules/auth/session/logout.handler';
import { RefreshHandler } from '~/modules/auth/session/refresh.handler';
import { AuthSessionController } from '~/modules/auth/session/session.controller';

@Module({
  controllers: [AuthSessionController],
  imports: [CqrsModule],
  providers: [LoginHandler, LogoutHandler, RefreshHandler],
})
export class AuthSessionModule {}
