import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { InternalCustomerAccountController } from '#/modules/customer/account/account.controller';
import { BanCustomerHandler } from '#/modules/customer/account/ban-customer.handler';
import { DeleteCustomerHandler } from '#/modules/customer/account/delete-customer.handler';
import { UnbanCustomerHandler } from '#/modules/customer/account/unban-customer.handler';

@Module({
  imports: [CqrsModule],
  controllers: [InternalCustomerAccountController],
  providers: [BanCustomerHandler, UnbanCustomerHandler, DeleteCustomerHandler],
})
export class CustomerAccountModule {}
