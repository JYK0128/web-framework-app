import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { SYSTEM_CONFIG_HANDLERS } from './handlers';
import { SystemConfigController } from './system-config.controller';

@Module({
  imports: [CqrsModule],
  controllers: [SystemConfigController],
  providers: [
    ...SYSTEM_CONFIG_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class SystemConfigModule {}
