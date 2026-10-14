import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { InternalCustomerAccountController } from '#/modules/customers/account/account.controller';
import { BanCustomerHandler } from '#/modules/customers/account/ban-customer.handler';
import { DeleteCustomerHandler } from '#/modules/customers/account/delete-customer.handler';
import { UnbanCustomerHandler } from '#/modules/customers/account/unban-customer.handler';

@Module({
  imports: [CqrsModule],
  controllers: [InternalCustomerAccountController],
  providers: [BanCustomerHandler, UnbanCustomerHandler, DeleteCustomerHandler],
})
export class CustomerAccountModule {}
