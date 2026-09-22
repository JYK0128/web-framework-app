import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { serviceTermHandlers } from './handlers';
import { ServiceTermsController } from './service-terms.controller';
@Module({ imports: [CqrsModule], controllers: [ServiceTermsController], providers: [...serviceTermHandlers] })
export class ServiceTermsModule {}
