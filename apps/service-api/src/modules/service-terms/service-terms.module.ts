import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CreateInternalServiceTermGroupHandler, CreateInternalServiceTermHandler, DeleteInternalServiceTermGroupHandler, DeleteInternalServiceTermHandler, GetInternalServiceTermGroupsHandler, GetInternalServiceTermsHandler, PublishInternalServiceTermHandler, serviceTermHandlers, UpdateInternalServiceTermGroupHandler, UpdateInternalServiceTermHandler } from './handlers';
import { ServiceTermsController } from './service-terms.controller';

@Module({ imports: [CqrsModule], controllers: [ServiceTermsController], providers: [...serviceTermHandlers, GetInternalServiceTermsHandler, CreateInternalServiceTermHandler, UpdateInternalServiceTermHandler, DeleteInternalServiceTermHandler, PublishInternalServiceTermHandler, GetInternalServiceTermGroupsHandler, CreateInternalServiceTermGroupHandler, UpdateInternalServiceTermGroupHandler, DeleteInternalServiceTermGroupHandler] })
export class ServiceTermsModule {}
