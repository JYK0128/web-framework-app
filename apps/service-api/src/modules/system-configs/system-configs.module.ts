import { Module } from '@nestjs/common';

import { SupportRuntimeConfigService } from '#/modules/support/support-runtime-config.service';

import { SystemConfigsController } from './system-configs.controller';

@Module({
  controllers: [SystemConfigsController],
  providers: [SupportRuntimeConfigService],
  exports: [SupportRuntimeConfigService],
})
export class SystemConfigsModule {}
