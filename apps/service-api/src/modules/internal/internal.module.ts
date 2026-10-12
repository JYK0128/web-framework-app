import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { customerHandlers } from '#/modules/customers/customers.handlers';
import { GetInternalFaqsHandler } from '#/modules/faqs/get-internal-faqs.handler';
import { CreateFaqHandler, DeleteFaqHandler, UpdateFaqHandler } from '#/modules/faqs/internal-faq-actions.handler';

import { BanCustomerHandler, DeleteCustomerHandler, UnbanCustomerHandler, UpdateCustomerMemoHandler, UpdateCustomerRoleHandler } from './customers/customer-actions.handler';
import { InternalCustomersController } from './internal-customers.controller';
import { InternalFaqsController } from './internal-faqs.controller';
import { InternalServiceTermsController } from './internal-service-terms.controller';
import { CreateCustomerMembershipHandler, DeleteCustomerMembershipHandler, GetCustomerMembershipPermissionsHandler, GetCustomerMembershipsHandler, UpdateCustomerMembershipHandler } from './memberships/customer-membership.handlers';

@Module({
  controllers: [InternalCustomersController, InternalFaqsController, InternalServiceTermsController],
  imports: [CqrsModule],
  providers: [...customerHandlers, GetInternalFaqsHandler, CreateFaqHandler, UpdateFaqHandler, DeleteFaqHandler, BanCustomerHandler, DeleteCustomerHandler, UnbanCustomerHandler, UpdateCustomerMemoHandler, UpdateCustomerRoleHandler, GetCustomerMembershipsHandler, GetCustomerMembershipPermissionsHandler, CreateCustomerMembershipHandler, UpdateCustomerMembershipHandler, DeleteCustomerMembershipHandler],
})
export class InternalModule {}
