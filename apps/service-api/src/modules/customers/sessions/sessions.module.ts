import { Module } from '@nestjs/common';

import { InternalCustomerSessionsController } from '#/modules/customers/sessions/sessions.controller';

@Module({
  controllers: [InternalCustomerSessionsController],
})
export class CustomerSessionsModule {}
