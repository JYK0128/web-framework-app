import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AuthAccountController } from './account.controller';
import { FindIdHandler } from './find-id.handler';
import { RegisterHandler } from './register.handler';
import { UnregisterHandler } from './unregister.handler';

@Module({
  controllers: [AuthAccountController],
  imports: [CqrsModule],
  providers: [FindIdHandler, RegisterHandler, UnregisterHandler],
})
export class AuthAccountModule {}
