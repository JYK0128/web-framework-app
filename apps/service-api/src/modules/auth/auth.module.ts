import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AuthController } from './auth.controller';
import { authHandlers } from './handlers/index';

@Module({
  imports: [CqrsModule],
  controllers: [AuthController],
  providers: [
    ...authHandlers,
  ],
})
export class AuthModule {}
