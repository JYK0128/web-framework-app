import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { InternalSystemConfigController } from '#/modules/system-configs/internal-system-config.controller';
import { SystemMaintenanceGuard } from '#/modules/system-configs/maintenance/system-maintenance.guard';
import { ServiceContext } from '#/modules/system-configs/service.context';
import { SystemContext } from '#/modules/system-configs/system.context';
import { SystemConfigService } from '#/modules/system-configs/system-config.service';
import { SystemConfigsController } from '#/modules/system-configs/system-configs.controller';

@Module({
  controllers: [SystemConfigsController, InternalSystemConfigController],
  providers: [
    ServiceContext,
    SystemContext,
    SystemConfigService,
    { provide: APP_GUARD, useClass: SystemMaintenanceGuard },
  ],
  exports: [ServiceContext, SystemContext],
})
export class SystemConfigsModule {}
