import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { GetInternalServiceTermsHandler } from './get-internal-service-terms.handler';
import { GetInternalServiceTermGroupsHandler } from './groups/get-internal-service-term-groups.handler';
import { CreateInternalServiceTermGroupHandler, DeleteInternalServiceTermGroupHandler, UpdateInternalServiceTermGroupHandler } from './groups/internal-service-term-group-actions.handler';
import { CreateInternalServiceTermHandler, DeleteInternalServiceTermHandler, PublishInternalServiceTermHandler, UpdateInternalServiceTermHandler } from './internal-service-term-actions.handler';
import { ServiceTermsController } from './service-terms.controller';
import { serviceTermHandlers } from './service-terms.handlers';

@Module({ imports: [CqrsModule], controllers: [ServiceTermsController], providers: [...serviceTermHandlers, GetInternalServiceTermsHandler, CreateInternalServiceTermHandler, UpdateInternalServiceTermHandler, DeleteInternalServiceTermHandler, PublishInternalServiceTermHandler, GetInternalServiceTermGroupsHandler, CreateInternalServiceTermGroupHandler, UpdateInternalServiceTermGroupHandler, DeleteInternalServiceTermGroupHandler] })
export class ServiceTermsModule {}
