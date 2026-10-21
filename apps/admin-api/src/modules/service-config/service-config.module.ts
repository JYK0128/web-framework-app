import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { GetServiceConfigHandler } from '~/modules/service-config/get-service-config.handler';
import { ServiceConfigOperationModule } from '~/modules/service-config/operation/operation.module';
import { ServiceConfigController } from '~/modules/service-config/service-config.controller';
import { UpdateServiceConfigHandler } from '~/modules/service-config/update-service-config.handler';

@Module({
  imports: [CqrsModule, ServiceConfigOperationModule],
  controllers: [ServiceConfigController],
  providers: [GetServiceConfigHandler, UpdateServiceConfigHandler],
})
export class ServiceConfigModule {}
