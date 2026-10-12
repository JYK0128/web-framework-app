import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { GetHolidaysHandler } from './get-holidays.handler';
import { ServiceConfigOperationController } from './operation.controller';

@Module({ imports: [CqrsModule], controllers: [ServiceConfigOperationController], providers: [GetHolidaysHandler] })
export class ServiceConfigOperationModule {}
