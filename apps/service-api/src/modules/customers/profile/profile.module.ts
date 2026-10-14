import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { GetCustomerByIdHandler } from '#/modules/customers/profile/get-customer-by-id.handler';
import { GetCustomersHandler } from '#/modules/customers/profile/get-customers.handler';
import { InternalCustomerProfileController } from '#/modules/customers/profile/profile.controller';
import { UpdateCustomerMemoHandler } from '#/modules/customers/profile/update-customer-memo.handler';

@Module({
  imports: [CqrsModule],
  controllers: [InternalCustomerProfileController],
  providers: [GetCustomersHandler, GetCustomerByIdHandler, UpdateCustomerMemoHandler],
})
export class CustomerProfileModule {}
