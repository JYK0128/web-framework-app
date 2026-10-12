import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { SystemConfigModule } from '#/modules/system-config/system-config.module';

import { SERVICE_CONFIG_HANDLERS } from './handlers';
import { ServiceConfigController } from './service-config.controller';

@Module({
  imports: [CqrsModule, SystemConfigModule],
  controllers: [ServiceConfigController],
  providers: [...SERVICE_CONFIG_HANDLERS],
})
export class ServiceConfigModule {}
