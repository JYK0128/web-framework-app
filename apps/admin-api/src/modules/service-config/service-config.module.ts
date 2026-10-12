import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { GetServiceConfigHandler } from './get-service-config.handler';
import { ServiceConfigOperationModule } from './operation/operation.module';
import { ServiceConfigController } from './service-config.controller';
import { UpdateServiceConfigHandler } from './update-service-config.handler';

@Module({
  imports: [CqrsModule, ServiceConfigOperationModule],
  controllers: [ServiceConfigController],
  providers: [GetServiceConfigHandler, UpdateServiceConfigHandler],
})
export class ServiceConfigModule {}
