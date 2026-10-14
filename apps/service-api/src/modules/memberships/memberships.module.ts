import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CreateCustomerMembershipHandler } from '#/modules/memberships/create-customer-membership.handler';
import { DeleteCustomerMembershipHandler } from '#/modules/memberships/delete-customer-membership.handler';
import { GetCustomerMembershipPermissionsHandler } from '#/modules/memberships/get-customer-membership-permissions.handler';
import { GetCustomerMembershipsHandler } from '#/modules/memberships/get-customer-memberships.handler';
import { InternalMembershipsController } from '#/modules/memberships/memberships.controller';
import { UpdateCustomerMembershipHandler } from '#/modules/memberships/update-customer-membership.handler';

@Module({
  imports: [CqrsModule],
  controllers: [InternalMembershipsController],
  providers: [GetCustomerMembershipsHandler, GetCustomerMembershipPermissionsHandler, CreateCustomerMembershipHandler, UpdateCustomerMembershipHandler, DeleteCustomerMembershipHandler],
})
export class MembershipsModule {}
