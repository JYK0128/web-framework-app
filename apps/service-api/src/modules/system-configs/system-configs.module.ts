import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { MachineModule } from '#/infra/auth/machine/machine.module';

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
    { provide: APP_GUARD, useClass: MaintenanceGuard },
  ],
  exports: [AdminConfigClient],
})
export class SystemConfigsModule {}
