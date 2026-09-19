import { Module } from '@nestjs/common';

import { InternalUsersController } from './internal-users.controller';

@Module({
  controllers: [InternalUsersController],
})
export class InternalModule {}
