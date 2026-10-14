import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { InternalCustomerMembershipController } from '#/modules/customers/membership/membership.controller';
import { UpdateCustomerRoleHandler } from '#/modules/customers/membership/update-customer-role.handler';

@Module({
  imports: [CqrsModule],
  controllers: [InternalCustomerMembershipController],
  providers: [UpdateCustomerRoleHandler],
})
export class CustomerMembershipModule {}
