import { Module } from '@nestjs/common';

import { InternalCustomerSessionsController } from '~/modules/customer/session/sessions.controller';

@Module({
  controllers: [InternalCustomerSessionsController],
})
export class CustomerSessionsModule {}
