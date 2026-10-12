import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { SystemConfigModule } from '#/modules/system-config/system-config.module';

import { ServiceConfigController } from './service-config.controller';
import { SERVICE_CONFIG_HANDLERS } from './service-config.handlers';

@Module({
  imports: [CqrsModule, SystemConfigModule],
  controllers: [ServiceConfigController],
  providers: [...SERVICE_CONFIG_HANDLERS],
})
export class ServiceConfigModule {}
