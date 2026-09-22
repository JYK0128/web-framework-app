import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CustomersController } from './customers.controller';
import { customerHandlers } from './handlers';

@Module({
  imports: [CqrsModule],
  controllers: [CustomersController],
  providers: [...customerHandlers],
})
export class CustomersModule {}
