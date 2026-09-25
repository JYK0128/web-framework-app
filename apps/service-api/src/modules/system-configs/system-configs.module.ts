import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { MachineModule } from '#/infra/auth/machine/machine.module';
import { SupportRuntimeConfigService } from '#/modules/support/support-runtime-config.service';

import { AdminConfigClient } from './admin-config.client';
import { MaintenanceGuard } from './maintenance.guard';
import { MaintenanceService } from './maintenance.service';
import { SystemConfigsController } from './system-configs.controller';

@Module({
  imports: [MachineModule],
  controllers: [SystemConfigsController],
  providers: [
    AdminConfigClient,
    MaintenanceService,
    SupportRuntimeConfigService,
    { provide: APP_GUARD, useClass: MaintenanceGuard },
  ],
  exports: [AdminConfigClient, MaintenanceService, SupportRuntimeConfigService],
})
export class SystemConfigsModule {}
