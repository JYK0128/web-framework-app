import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { InternalCustomerMembershipController } from '~/modules/customer/membership/membership.controller';
import { UpdateCustomerRoleHandler } from '~/modules/customer/membership/update-customer-role.handler';

@Module({
  imports: [CqrsModule],
  controllers: [InternalCustomerMembershipController],
  providers: [UpdateCustomerRoleHandler],
})
export class CustomerMembershipModule {}
