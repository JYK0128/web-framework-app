import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { customerHandlers } from '#/modules/customers/handlers';
import { GetInternalFaqsHandler } from '#/modules/faqs/handlers/get-internal-faqs.handler';
import { CreateFaqHandler, DeleteFaqHandler, UpdateFaqHandler } from '#/modules/faqs/handlers/internal-faq-actions.handler';

import { BanCustomerHandler, DeleteCustomerHandler, UnbanCustomerHandler, UpdateCustomerRoleHandler } from './handlers/customer-actions.handler';
import { InternalFaqsController } from './internal-faqs.controller';
import { InternalServiceTermsController } from './internal-service-terms.controller';
import { InternalUsersController } from './internal-users.controller';

@Module({
  controllers: [InternalUsersController, InternalFaqsController, InternalServiceTermsController],
  imports: [CqrsModule],
  providers: [...customerHandlers, GetInternalFaqsHandler, CreateFaqHandler, UpdateFaqHandler, DeleteFaqHandler, BanCustomerHandler, DeleteCustomerHandler, UnbanCustomerHandler, UpdateCustomerRoleHandler],
})
export class InternalModule {}
