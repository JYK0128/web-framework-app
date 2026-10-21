import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CreateCustomerMembershipHandler } from '~/modules/membership/create-customer-membership.handler';
import { DeleteCustomerMembershipHandler } from '~/modules/membership/delete-customer-membership.handler';
import { GetCustomerMembershipPermissionsHandler } from '~/modules/membership/get-customer-membership-permissions.handler';
import { GetCustomerMembershipsHandler } from '~/modules/membership/get-customer-memberships.handler';
import { InternalMembershipsController } from '~/modules/membership/memberships.controller';
import { UpdateCustomerMembershipHandler } from '~/modules/membership/update-customer-membership.handler';

@Module({
  imports: [CqrsModule],
  controllers: [InternalMembershipsController],
  providers: [GetCustomerMembershipsHandler, GetCustomerMembershipPermissionsHandler, CreateCustomerMembershipHandler, UpdateCustomerMembershipHandler, DeleteCustomerMembershipHandler],
})
export class MembershipsModule {}
