import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { customerHandlers } from '#/modules/customers/handlers';
import { GetInternalFaqsHandler } from '#/modules/faqs/handlers/get-internal-faqs.handler';
import { CreateFaqHandler, DeleteFaqHandler, UpdateFaqHandler } from '#/modules/faqs/handlers/internal-faq-actions.handler';

import { BanCustomerHandler, DeleteCustomerHandler, UnbanCustomerHandler, UpdateCustomerMemoHandler, UpdateCustomerRoleHandler } from './handlers/customer-actions.handler';
import { CreateCustomerMembershipHandler, DeleteCustomerMembershipHandler, GetCustomerMembershipPermissionsHandler, GetCustomerMembershipsHandler, UpdateCustomerMembershipHandler } from './handlers/customer-membership.handlers';
import { InternalCustomersController } from './internal-customers.controller';
import { InternalFaqsController } from './internal-faqs.controller';
import { InternalServiceTermsController } from './internal-service-terms.controller';

@Module({
  controllers: [InternalCustomersController, InternalFaqsController, InternalServiceTermsController],
  imports: [CqrsModule],
  providers: [...customerHandlers, GetInternalFaqsHandler, CreateFaqHandler, UpdateFaqHandler, DeleteFaqHandler, BanCustomerHandler, DeleteCustomerHandler, UnbanCustomerHandler, UpdateCustomerMemoHandler, UpdateCustomerRoleHandler, GetCustomerMembershipsHandler, GetCustomerMembershipPermissionsHandler, CreateCustomerMembershipHandler, UpdateCustomerMembershipHandler, DeleteCustomerMembershipHandler],
})
export class InternalModule {}
