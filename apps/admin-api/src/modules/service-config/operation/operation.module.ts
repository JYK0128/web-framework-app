import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { GetHolidaysHandler } from '#/modules/service-config/operation/get-holidays.handler';
import { ServiceConfigOperationController } from '#/modules/service-config/operation/operation.controller';

@Module({ imports: [CqrsModule], controllers: [ServiceConfigOperationController], providers: [GetHolidaysHandler] })
export class ServiceConfigOperationModule {}
