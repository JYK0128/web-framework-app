import { Module } from '@nestjs/common';

import { MachineModule } from '#/infra/auth/machine/machine.module';
import { SupportRuntimeConfigService } from '#/modules/support/support-runtime-config.service';

import { AdminConfigClient } from './admin-config.client';
import { SystemConfigsController } from './system-configs.controller';

@Module({
  imports: [MachineModule],
  controllers: [SystemConfigsController],
  providers: [
    AdminConfigClient,
    SupportRuntimeConfigService,
  ],
  exports: [AdminConfigClient, SupportRuntimeConfigService],
})
export class SystemConfigsModule {}
