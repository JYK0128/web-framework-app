import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { ServiceConfigController } from './service-config.controller';
import { SERVICE_CONFIG_HANDLERS } from './service-config.handlers';

@Module({
  imports: [CqrsModule],
  controllers: [ServiceConfigController],
  providers: [...SERVICE_CONFIG_HANDLERS],
})
export class ServiceConfigModule {}
