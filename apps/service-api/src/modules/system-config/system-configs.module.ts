import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { InternalSystemConfigController } from '#/modules/system-config/internal-system-config.controller';
import { SystemMaintenanceGuard } from '#/modules/system-config/maintenance/system-maintenance.guard';
import { ServiceContext } from '#/modules/system-config/service.context';
import { SystemContext } from '#/modules/system-config/system.context';
import { SystemConfigService } from '#/modules/system-config/system-config.service';
import { SystemConfigsController } from '#/modules/system-config/system-configs.controller';

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
