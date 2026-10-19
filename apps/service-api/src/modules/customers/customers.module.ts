import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { customerHandlers } from './handlers';

@Module({
  imports: [CqrsModule],
  providers: [...customerHandlers],
})
export class CustomersModule {}
