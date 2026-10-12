import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { InternalSystemConfigController } from './internal-system-config.controller';
import { SystemMaintenanceGuard } from './maintenance/system-maintenance.guard';
import { SystemContext } from './system.context';
import { SystemConfigService } from './system-config.service';
import { SystemConfigsController } from './system-configs.controller';

@Module({
  controllers: [SystemConfigsController, InternalSystemConfigController],
  providers: [
    SystemContext,
    SystemConfigService,
    { provide: APP_GUARD, useClass: SystemMaintenanceGuard },
  ],
  exports: [SystemContext],
})
export class SystemConfigsModule {}
