import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { GetCustomerByIdHandler } from '~/modules/customer/profile/get-customer-by-id.handler';
import { GetCustomersHandler } from '~/modules/customer/profile/get-customers.handler';
import { InternalCustomerProfileController } from '~/modules/customer/profile/profile.controller';
import { UpdateCustomerMemoHandler } from '~/modules/customer/profile/update-customer-memo.handler';

@Module({
  imports: [CqrsModule],
  controllers: [InternalCustomerProfileController],
  providers: [GetCustomersHandler, GetCustomerByIdHandler, UpdateCustomerMemoHandler],
})
export class CustomerProfileModule {}
