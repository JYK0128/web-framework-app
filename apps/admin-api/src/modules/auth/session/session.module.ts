import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { LoginHandler } from './login.handler';
import { LogoutHandler } from './logout.handler';
import { RefreshHandler } from './refresh.handler';
import { AuthSessionController } from './session.controller';

@Module({
  controllers: [AuthSessionController],
  imports: [CqrsModule],
  providers: [LoginHandler, LogoutHandler, RefreshHandler],
})
export class AuthSessionModule {}
