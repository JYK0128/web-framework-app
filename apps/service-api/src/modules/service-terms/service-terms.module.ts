import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateAdminServiceTermGroupHandler, CreateAdminServiceTermHandler, DeleteAdminServiceTermGroupHandler, DeleteAdminServiceTermHandler, GetAdminServiceTermGroupsHandler, GetAdminServiceTermsHandler, PublishAdminServiceTermHandler, serviceTermHandlers, UpdateAdminServiceTermGroupHandler, UpdateAdminServiceTermHandler } from './handlers';
import { ServiceTermsController } from './service-terms.controller';
@Module({ imports: [CqrsModule], controllers: [ServiceTermsController], providers: [...serviceTermHandlers, GetAdminServiceTermsHandler, CreateAdminServiceTermHandler, UpdateAdminServiceTermHandler, DeleteAdminServiceTermHandler, PublishAdminServiceTermHandler, GetAdminServiceTermGroupsHandler, CreateAdminServiceTermGroupHandler, UpdateAdminServiceTermGroupHandler, DeleteAdminServiceTermGroupHandler] })
export class ServiceTermsModule {}
