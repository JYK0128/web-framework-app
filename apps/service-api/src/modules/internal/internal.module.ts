import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { customerHandlers } from '../customers/handlers';
import { InternalUsersController } from './internal-users.controller';

@Module({
  controllers: [InternalUsersController],
  imports: [CqrsModule],
  providers: [...customerHandlers],
})
export class InternalModule {}
